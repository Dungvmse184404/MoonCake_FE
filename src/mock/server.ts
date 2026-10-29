// A tiny in-browser stand-in for MoonCake_BE, used by `pnpm dev:mock` (vite --mode mock).
// It answers the same routes and ApiResult envelope as the real API, from the data in ./db.
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BoxItem } from "@/lib/boxApi";
import type { Cart, CartGroup } from "@/lib/cartApi";
import type { Product } from "@/lib/catalog";
import type { Order, OrderItem } from "@/lib/orderApi";
import type { OrganizerRegistration } from "@/lib/organizerApi";
import { db, MOCK_PASSWORD, type MockUser } from "./db";

type Query = URLSearchParams;
type Body = any;

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const ok = (data?: unknown, message = "OK") => ({ isSuccess: true, value: { code: "200", message, data } });
const now = () => new Date().toISOString();
const b64 = (o: unknown) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

const tokensFor = (u: MockUser) => ({
  accessToken: `${b64({ alg: "none", typ: "JWT" })}.${b64({ sub: u.id, role: u.role })}.mock`,
  refreshToken: `refresh.${u.id}`,
});

function userFromToken(header: string | null): MockUser | null {
  const token = header?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const payload = JSON.parse(decodeURIComponent(escape(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))));
    return db.users.find((u) => u.id === payload.sub) ?? null;
  } catch {
    return null;
  }
}

function paged<T>(items: T[], q: Query) {
  const page = Math.max(1, Number(q.get("page") ?? 1));
  const pageSize = Math.max(1, Number(q.get("pageSize") ?? 10));
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    currentPage: page,
    pageSize,
    totalCount,
    totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
  };
}

const matches = (q: Query, ...fields: Array<string | null | undefined>) => {
  const s = q.get("search")?.trim().toLowerCase();
  return !s || fields.some((f) => f?.toLowerCase().includes(s));
};
const byNewest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);
const find = <T extends { id: string }>(list: T[], id: string, what: string) => {
  const item = list.find((x) => x.id === id);
  if (!item) throw new HttpError(404, `${what} not found.`);
  return item;
};

function need(u: MockUser | null, role?: MockUser["role"]): MockUser {
  if (!u) throw new HttpError(401, "Unauthorized");
  if (role && u.role !== role) throw new HttpError(403, "Forbidden");
  return u;
}
const myOrganizer = (u: MockUser | null) => {
  const me = need(u, "Organization");
  return find(db.organizers, me.organizerId ?? "", "Organizer");
};

const notify = (userId: string | undefined, title: string, content: string) => {
  if (!userId) return;
  db.notifications.unshift({ userId, value: { id: db.nextId("n"), type: "Order", title, content, isRead: false, createdAt: now() } });
};
const organizerUserId = (organizerId: string) => db.users.find((u) => u.organizerId === organizerId)?.id;

// ---- catalog helpers ----

function productFromBody(o: { id: string; brandName: string }, body: Body, base?: Product): Product {
  const categoryIds: string[] = body.categoryIds ?? base?.categories.map((c) => c.id) ?? [];
  const fillingIds: string[] = body.fillingIds ?? base?.fillings.map((f) => f.id) ?? [];
  if (!categoryIds.length) throw new HttpError(400, "At least one category is required.");
  if (!fillingIds.length) throw new HttpError(400, "At least one filling is required.");
  const images: Array<{ imageUrl: string; isPrimary: boolean }> | undefined = body.images;
  return {
    id: base?.id ?? db.nextId("p"),
    organizerId: o.id,
    organizerBrandName: o.brandName,
    name: body.name ?? base?.name ?? "",
    description: body.description ?? base?.description ?? null,
    imageUrl: images ? (images.find((i) => i.isPrimary) ?? images[0])?.imageUrl ?? null : (base?.imageUrl ?? null),
    stallIds: base?.stallIds ?? [],
    price: Number(body.price ?? base?.price ?? 0),
    stockQuantity: base?.stockQuantity ?? Number(body.stockQuantity ?? 0),
    status: base?.status ?? "Draft",
    categories: db.categories.filter((c) => categoryIds.includes(c.id)).map(({ id, name }) => ({ id, name })),
    fillings: db.fillings.filter((f) => fillingIds.includes(f.id)).map(({ id, name }) => ({ id, name })),
    createdAt: base?.createdAt ?? now(),
  };
}

function boxFromBody(o: { id: string; brandName: string }, body: Body, base?: BoxItem): BoxItem {
  const productIds: string[] = body.productIds ?? base?.products.map((p) => p.id) ?? [];
  if (!productIds.length) throw new HttpError(400, "At least one product id is required.");
  const images: Array<{ imageUrl: string; isPrimary: boolean }> | undefined = body.images;
  return {
    id: base?.id ?? db.nextId("b"),
    stallIds: base?.stallIds ?? [],
    organizerId: o.id,
    organizerBrandName: o.brandName,
    name: body.name ?? base?.name ?? "",
    description: body.description ?? base?.description ?? null,
    imageUrl: images ? (images.find((i) => i.isPrimary) ?? images[0])?.imageUrl ?? null : (base?.imageUrl ?? null),
    capacity: Number(body.capacity ?? base?.capacity ?? 1),
    price: Number(body.price ?? base?.price ?? 0),
    status: base?.status ?? "Draft",
    products: db.products
      .filter((p) => productIds.includes(p.id))
      .map(({ id, name, imageUrl, status, categories, fillings }) => ({ id, name, imageUrl, status, categories, fillings })),
    createdAt: base?.createdAt ?? now(),
  };
}

function resolveStall(stallIds: string[] | undefined, requested: string | null | undefined, name: string): string | null {
  const ids = stallIds ?? [];
  if (ids.length === 0) return null;
  if (ids.length === 1) return ids[0];
  if (!requested) throw new HttpError(400, `Stall id is required for '${name}' because it is assigned to multiple stalls.`);
  if (!ids.includes(requested)) throw new HttpError(400, `Selected stall is not available for '${name}'.`);
  return requested;
}

// ---- cart ----

function cartOf(userId: string): Cart {
  const lines = db.cartLines[userId] ?? [];
  const groups = new Map<string, CartGroup>();
  for (const line of lines) {
    const ref = line.kind === "Product" ? db.products.find((p) => p.id === line.refId) : db.boxes.find((b) => b.id === line.refId);
    if (!ref) continue;
    const key = `${ref.organizerId}|${line.stallId ?? ""}`;
    const group = groups.get(key) ?? {
      organizerId: ref.organizerId,
      organizerBrandName: ref.organizerBrandName,
      stallId: line.stallId,
      items: [],
      subtotalAmount: 0,
    };
    group.items.push({
      id: line.id,
      itemType: line.kind,
      productId: line.kind === "Product" ? ref.id : null,
      boxItemId: line.kind === "Box" ? ref.id : null,
      name: ref.name,
      imageUrl: ref.imageUrl,
      unitPrice: ref.price,
    });
    group.subtotalAmount += ref.price;
    groups.set(key, group);
  }
  const list = [...groups.values()];
  return {
    ...db.emptyCart(userId),
    groups: list,
    totalAmount: list.reduce((n, g) => n + g.subtotalAmount, 0),
    totalItemCount: list.reduce((n, g) => n + g.items.length, 0),
  };
}

function addToCart(u: MockUser, kind: "Product" | "Box", refId: string, stallId: string | null) {
  const ref = kind === "Product" ? find(db.products, refId, "Product") : find(db.boxes, refId, "Box item");
  if (ref.status !== "Active") throw new HttpError(409, "Product is not available for purchase.");
  const resolved = resolveStall(ref.stallIds, stallId, ref.name);
  const lines = (db.cartLines[u.id] ??= []);
  if (!lines.some((l) => l.kind === kind && l.refId === refId && l.stallId === resolved)) {
    lines.push({ id: db.nextId("ci"), kind, refId, stallId: resolved });
  }
  return cartOf(u.id);
}

// ---- orders ----

let orderSeq = 1100;

interface Line {
  itemType: "Product" | "Box";
  productId?: string;
  boxItemId?: string;
  stallId?: string | null;
  categoryId?: string;
  fillingId?: string;
  quantity?: number;
  selections?: Array<{ productId: string; categoryId: string; fillingId: string; quantity: number }>;
}

function placeOrders(u: MockUser, lines: Line[], note: string | null): Order[] {
  if (!lines?.length) throw new HttpError(400, "At least one order item is required.");
  if (!u.fullName) throw new HttpError(400, "Please update your full name in your profile before placing an order.");
  if (!u.phone) throw new HttpError(400, "Please update your phone number in your profile before placing an order.");
  if (!u.address) throw new HttpError(400, "Please update your address in your profile before placing an order.");

  const groups = new Map<string, { organizerId: string; brand: string; stallId: string | null; items: OrderItem[] }>();
  for (const line of lines) {
    let item: OrderItem;
    let organizerId: string;
    let brand: string;
    let stallId: string | null;
    if (line.itemType === "Product") {
      const p = find(db.products, line.productId ?? "", "Product");
      if (p.status !== "Active") throw new HttpError(409, `Product '${p.name}' is not available for purchase.`);
      const qty = Number(line.quantity ?? 0);
      if (qty < 1) throw new HttpError(400, "Quantity is required for product items.");
      if (qty > p.stockQuantity) throw new HttpError(409, `Not enough stock for '${p.name}'.`);
      const category = p.categories.find((c) => c.id === line.categoryId);
      const filling = p.fillings.find((f) => f.id === line.fillingId);
      if (!category) throw new HttpError(400, `Category is not available for product '${p.name}'.`);
      if (!filling) throw new HttpError(400, `Filling is not available for product '${p.name}'.`);
      stallId = resolveStall(p.stallIds, line.stallId, p.name);
      p.stockQuantity -= qty;
      if (p.stockQuantity === 0) p.status = "OutOfStock";
      ({ organizerId, organizerBrandName: brand } = p);
      item = {
        id: db.nextId("oi"), itemType: "Product", productId: p.id, categoryName: category.name, fillingName: filling.name,
        name: p.name, imageUrl: p.imageUrl, quantity: qty, unitPrice: p.price, subtotal: p.price * qty, boxSelections: [],
      };
    } else {
      const b = find(db.boxes, line.boxItemId ?? "", "Box item");
      if (b.status !== "Active") throw new HttpError(409, `Box item '${b.name}' is not available for purchase.`);
      const selections = line.selections ?? [];
      const total = selections.reduce((n, s) => n + Number(s.quantity), 0);
      if (total !== b.capacity) throw new HttpError(400, `Total selection quantity must equal box capacity (${b.capacity}).`);
      stallId = resolveStall(b.stallIds, line.stallId, b.name);
      ({ organizerId, organizerBrandName: brand } = b);
      item = {
        id: db.nextId("oi"), itemType: "Box", boxItemId: b.id, name: b.name, imageUrl: b.imageUrl, quantity: 1,
        unitPrice: b.price, subtotal: b.price,
        boxSelections: selections.map((s) => {
          const p = b.products.find((x) => x.id === s.productId);
          if (!p) throw new HttpError(400, "One or more products are not allowed in this box.");
          return {
            ...s,
            productName: p.name,
            imageUrl: p.imageUrl,
            categoryName: p.categories.find((c) => c.id === s.categoryId)?.name ?? "",
            fillingName: p.fillings.find((f) => f.id === s.fillingId)?.name ?? "",
          };
        }),
      };
    }
    const key = `${organizerId}|${stallId ?? ""}`;
    const group = groups.get(key) ?? { organizerId, brand, stallId, items: [] };
    group.items.push(item);
    groups.set(key, group);
  }

  const created = [...groups.values()].map((g): Order => {
    const subtotal = g.items.reduce((n, i) => n + i.subtotal, 0);
    const order: Order = {
      id: db.nextId("or"),
      orderCode: `MC-${++orderSeq}`,
      stallId: g.stallId,
      organizerId: g.organizerId,
      organizerBrandName: g.brand,
      receiverName: u.fullName,
      receiverPhone: u.phone ?? "",
      shippingAddress: u.address ?? "",
      note,
      subtotalAmount: subtotal,
      platformDiscount: 0,
      organizerDiscount: 0,
      totalAmount: subtotal,
      status: "Pending",
      items: g.items,
      createdAt: now(),
    };
    db.orders.unshift(order);
    db.orderOwners[order.id] = u.id;
    notify(organizerUserId(g.organizerId), `Đơn mới #${order.orderCode}`, `${u.fullName} vừa đặt ${g.items.length} món.`);
    return order;
  });
  notify(u.id, "Đặt hàng thành công", `${created.length} đơn đã được gửi tới cửa hàng.`);
  return created;
}

// ---- registrations ----

function confirmRegistration(reg: OrganizerRegistration, userId: string) {
  const u = find(db.users, userId, "User");
  let organizerId = u.organizerId;
  if (!organizerId) {
    organizerId = db.nextId("o");
    db.organizers.push({
      id: organizerId, userFullName: u.fullName, userEmail: u.email, brandName: reg.brandName, contactPhone: reg.contactPhone,
      contactEmail: u.email, businessInfo: reg.businessInfo, status: "Active", approvedAt: now(), createdAt: now(),
    });
    u.organizerId = organizerId;
    u.role = "Organization";
  }
  reg.organizerId = organizerId;
  if (reg.type === "Stall" && reg.stallId) {
    const s = find(db.stalls, reg.stallId, "Stall");
    const o = find(db.organizers, organizerId, "Organizer");
    s.status = "Rented";
    db.rentals.push({
      id: db.nextId("r"), stallId: s.id, stallCode: s.code, stallName: s.name, stallLocation: s.location, rentalPrice: s.rentalPrice,
      organizerId, organizerBrandName: o.brandName, organizerUserFullName: u.fullName, organizerUserEmail: u.email,
      startDate: reg.startDate ?? now().slice(0, 10), endDate: reg.endDate, status: "Active", createdAt: now(),
    });
  }
}
const registrationOwners = db.registrationOwners;

// ---- router ----

type Handler = (ctx: { m: RegExpMatchArray; q: Query; body: Body; me: MockUser | null }) => unknown;
const routes: Array<[string, RegExp, Handler]> = [];
const on = (method: string, path: string, handler: Handler) =>
  routes.push([method, new RegExp(`^${path.replace(/:(\w+)/g, "([^/]+)")}$`), handler]);

// auth
on("POST", "/auth/login", ({ body }) => {
  const u = db.users.find((x) => x.email.toLowerCase() === String(body.email ?? "").trim().toLowerCase());
  if (!u || body.password !== MOCK_PASSWORD) throw new HttpError(401, "Invalid email or password.");
  if (u.status === "Locked") throw new HttpError(403, "Your account is locked.");
  return tokensFor(u);
});
on("POST", "/auth/refresh-token", ({ body }) => {
  const u = db.users.find((x) => `refresh.${x.id}` === body.refreshToken);
  if (!u) throw new HttpError(401, "Invalid refresh token.");
  return tokensFor(u);
});
on("POST", "/auth/register", ({ body }) => {
  if (db.users.some((u) => u.email === body.email)) throw new HttpError(409, "Email already exists.");
  db.users.push({
    id: db.nextId("u"), email: body.email, fullName: body.fullName, phone: body.phone, address: body.address,
    role: "User", status: "Active", isEmailVerified: true, createdAt: now(),
  });
  return undefined;
});
for (const path of ["/auth/verify-otp", "/auth/resend-otp", "/auth/forgot-password", "/auth/reset-password", "/auth/logout"]) {
  on("POST", path, () => undefined);
}

// users
on("GET", "/users/me", ({ me }) => need(me));
on("PUT", "/users/me", ({ me, body }) => Object.assign(need(me), { fullName: body.fullName, phone: body.phone, address: body.address, updatedAt: now() }));
on("GET", "/users", ({ me, q }) => {
  need(me, "Manager");
  return paged(
    db.users.filter((u) => (!q.get("role") || u.role === q.get("role")) && (!q.get("status") || u.status === q.get("status")) && matches(q, u.fullName, u.email)),
    q,
  );
});

// categories and fillings (owned by organizers)
on("GET", "/cake-categories", ({ q }) => paged([...db.categories].sort((a, b) => a.name.localeCompare(b.name)), q));
on("GET", "/cake-categories/me", ({ me, q }) => paged(db.categories.filter((c) => c.organizerId === myOrganizer(me).id), q));
on("POST", "/cake-categories", ({ me, body }) => {
  const o = myOrganizer(me);
  const c = { id: db.nextId("c"), organizerId: o.id, organizerBrandName: o.brandName, name: body.name, description: body.description ?? null };
  db.categories.push(c);
  return c;
});
on("PUT", "/cake-categories/:id", ({ m, body }) => Object.assign(find(db.categories, m[1], "Category"), body));
on("DELETE", "/cake-categories/:id", ({ m }) => void db.categories.splice(db.categories.indexOf(find(db.categories, m[1], "Category")), 1));
on("GET", "/fillings", ({ q }) => paged(db.fillings, q));
on("GET", "/fillings/me", ({ me, q }) => paged(db.fillings.filter((f) => f.organizerId === myOrganizer(me).id), q));
on("POST", "/fillings", ({ me, body }) => {
  const f = { id: db.nextId("f"), organizerId: myOrganizer(me).id, name: body.name };
  db.fillings.push(f);
  return f;
});
on("PUT", "/fillings/:id", ({ m, body }) => Object.assign(find(db.fillings, m[1], "Filling"), { name: body.name }));
on("DELETE", "/fillings/:id", ({ m }) => void db.fillings.splice(db.fillings.indexOf(find(db.fillings, m[1], "Filling")), 1));

// products
on("GET", "/products", ({ q }) =>
  paged(
    db.products
      .filter(
        (p) =>
          (!q.get("status") || p.status === q.get("status")) &&
          (!q.get("categoryId") || p.categories.some((c) => c.id === q.get("categoryId") || c.name === db.categories.find((x) => x.id === q.get("categoryId"))?.name)) &&
          (!q.get("organizerId") || p.organizerId === q.get("organizerId")) &&
          (!q.get("stallId") || p.stallIds?.includes(q.get("stallId")!)) &&
          matches(q, p.name, p.organizerBrandName),
      )
      .sort(byNewest),
    q,
  ),
);
on("GET", "/products/me", ({ me, q }) => {
  const o = myOrganizer(me);
  return paged(db.products.filter((p) => p.organizerId === o.id && (!q.get("status") || p.status === q.get("status")) && matches(q, p.name)).sort(byNewest), q);
});
on("GET", "/products/:id", ({ m }) => find(db.products, m[1], "Product"));
on("POST", "/products", ({ me, body }) => {
  const p = productFromBody(myOrganizer(me), body);
  db.products.unshift(p);
  return p;
});
on("PUT", "/products/:id", ({ me, m, body }) => {
  const base = find(db.products, m[1], "Product");
  return Object.assign(base, productFromBody(myOrganizer(me), body, base));
});
on("PUT", "/products/:id/stalls", ({ m, body }) => Object.assign(find(db.products, m[1], "Product"), { stallIds: body.stallIds ?? [] }));
on("PUT", "/products/:id/status", ({ m, body }) => Object.assign(find(db.products, m[1], "Product"), { status: body.status }));
on("PUT", "/products/:id/stock", ({ m, body }) => {
  const p = find(db.products, m[1], "Product");
  p.stockQuantity = Math.max(0, p.stockQuantity + Number(body.quantityDelta ?? 0));
  return p;
});
on("DELETE", "/products/:id", ({ m }) => void db.products.splice(db.products.indexOf(find(db.products, m[1], "Product")), 1));

// combo boxes
on("GET", "/box-items", ({ q }) =>
  paged(
    db.boxes.filter(
      (b) =>
        (!q.get("status") || b.status === q.get("status")) &&
        (!q.get("organizerId") || b.organizerId === q.get("organizerId")) &&
        (!q.get("stallId") || b.stallIds.includes(q.get("stallId")!)) &&
        matches(q, b.name),
    ),
    q,
  ),
);
on("GET", "/box-items/me", ({ me, q }) => {
  const o = myOrganizer(me);
  return paged(db.boxes.filter((b) => b.organizerId === o.id && (!q.get("status") || b.status === q.get("status")) && matches(q, b.name)), q);
});
on("GET", "/box-items/:id", ({ m }) => find(db.boxes, m[1], "Box item"));
on("POST", "/box-items", ({ me, body }) => {
  const b = boxFromBody(myOrganizer(me), body);
  db.boxes.unshift(b);
  return b;
});
on("PUT", "/box-items/:id", ({ me, m, body }) => {
  const base = find(db.boxes, m[1], "Box item");
  return Object.assign(base, boxFromBody(myOrganizer(me), body, base));
});
on("PUT", "/box-items/:id/stalls", ({ m, body }) => Object.assign(find(db.boxes, m[1], "Box item"), { stallIds: body.stallIds ?? [] }));
on("PUT", "/box-items/:id/status", ({ m, body }) => Object.assign(find(db.boxes, m[1], "Box item"), { status: body.status }));
on("DELETE", "/box-items/:id", ({ m }) => void db.boxes.splice(db.boxes.indexOf(find(db.boxes, m[1], "Box item")), 1));

// cart
on("GET", "/carts/me", ({ me }) => cartOf(need(me).id));
on("POST", "/carts/items/product", ({ me, body }) => addToCart(need(me), "Product", body.productId, body.stallId ?? null));
on("POST", "/carts/items/box", ({ me, body }) => addToCart(need(me), "Box", body.boxItemId, body.stallId ?? null));
on("DELETE", "/carts/items/:id", ({ me, m }) => {
  const u = need(me);
  db.cartLines[u.id] = (db.cartLines[u.id] ?? []).filter((l) => l.id !== m[1]);
  return cartOf(u.id);
});

// orders
const ownOrders = (userId: string, q: Query) =>
  paged(db.orders.filter((o) => db.orderOwners[o.id] === userId && (!q.get("status") || o.status === q.get("status")) && matches(q, o.orderCode, o.organizerBrandName)), q);
on("GET", "/orders/me", ({ me, q }) => ownOrders(need(me).id, q));
on("GET", "/orders/organizer/me", ({ me, q }) => {
  const o = myOrganizer(me);
  return paged(db.orders.filter((x) => x.organizerId === o.id && (!q.get("status") || x.status === q.get("status")) && matches(q, x.orderCode, x.receiverName)), q);
});
on("GET", "/orders/:id", ({ me, m }) => {
  const u = need(me);
  const order = find(db.orders, m[1], "Order");
  if (db.orderOwners[order.id] !== u.id && order.organizerId !== u.organizerId && u.role !== "Manager") {
    throw new HttpError(403, "You can only view your own orders or orders of your organizer.");
  }
  return order;
});
on("POST", "/orders", ({ me, body }) => placeOrders(need(me), body.items, body.note ?? null));
on("POST", "/orders/:id/confirm", ({ me, m }) => {
  const o = myOrganizer(me);
  const order = find(db.orders, m[1], "Order");
  if (order.organizerId !== o.id) throw new HttpError(403, "You can only confirm orders of your own organizer.");
  if (order.status !== "Pending") throw new HttpError(409, "Only pending orders can be confirmed.");
  Object.assign(order, { status: "Confirmed", confirmedAt: now() });
  notify(db.orderOwners[order.id], `Đơn #${order.orderCode} đã được xác nhận`, `${order.organizerBrandName} đang chuẩn bị đơn của bạn.`);
  return order;
});
on("POST", "/orders/:id/cancel", ({ me, m, body }) => {
  const u = need(me);
  const order = find(db.orders, m[1], "Order");
  const isSeller = order.organizerId === u.organizerId;
  if (!isSeller && db.orderOwners[order.id] !== u.id) throw new HttpError(403, "Forbidden");
  if (!isSeller && order.status !== "Pending") throw new HttpError(409, "You can only cancel pending orders.");
  if (isSeller && !["Pending", "Confirmed"].includes(order.status)) throw new HttpError(409, "Only pending or confirmed orders can be cancelled.");
  Object.assign(order, { status: "Cancelled", cancelledAt: now(), cancelReason: body.reason });
  notify(isSeller ? db.orderOwners[order.id] : organizerUserId(order.organizerId), `Đơn #${order.orderCode} đã bị hủy`, body.reason);
  return order;
});

// stalls and rentals
on("GET", "/stalls", ({ q }) =>
  paged(db.stalls.filter((s) => (!q.get("status") || s.status === q.get("status")) && matches(q, s.code, s.name, s.location)).sort((a, b) => a.code.localeCompare(b.code)), q),
);
on("GET", "/stalls/:id", ({ m }) => find(db.stalls, m[1], "Stall"));
on("GET", "/stalls/:id/rentals", ({ m, q }) => paged(db.rentals.filter((r) => r.stallId === m[1]), q));
on("POST", "/stalls", ({ me, body }) => {
  need(me, "Manager");
  if (db.stalls.some((s) => s.code === body.code)) throw new HttpError(409, "Stall code already exists.");
  const s = { id: db.nextId("s"), status: "Available" as const, createdAt: now(), ...body };
  db.stalls.push(s);
  return s;
});
on("PUT", "/stalls/:id", ({ m, body }) => Object.assign(find(db.stalls, m[1], "Stall"), body));
on("DELETE", "/stalls/:id", ({ m }) => {
  const s = find(db.stalls, m[1], "Stall");
  if (s.status === "Rented") throw new HttpError(409, "Cannot delete a stall that is currently rented.");
  db.stalls.splice(db.stalls.indexOf(s), 1);
});
on("GET", "/stall-rentals", ({ me, q }) => {
  need(me, "Manager");
  return paged(db.rentals.filter((r) => (!q.get("status") || r.status === q.get("status")) && matches(q, r.stallCode, r.organizerBrandName)), q);
});
on("GET", "/stall-rentals/me", ({ me, q }) => {
  const o = myOrganizer(me);
  return paged(db.rentals.filter((r) => r.organizerId === o.id && (!q.get("status") || r.status === q.get("status"))), q);
});
on("PUT", "/stall-rentals/:id/terminate", ({ m }) => {
  const r = find(db.rentals, m[1], "Stall rental");
  if (r.status !== "Active") throw new HttpError(409, "Only an active stall rental can be terminated.");
  r.status = "Terminated";
  const s = db.stalls.find((x) => x.id === r.stallId);
  if (s) s.status = "Available";
  return r;
});

// organizer registrations
const newRegistration = (u: MockUser, body: Body, extra: Partial<OrganizerRegistration> = {}): OrganizerRegistration => {
  const s = body.stallId ? db.stalls.find((x) => x.id === body.stallId) : undefined;
  const reg: OrganizerRegistration = {
    id: db.nextId("reg"), userFullName: u.fullName, userEmail: u.email, type: body.type ?? "Stall",
    stallId: s?.id ?? null, stallCode: s?.code ?? null, stallName: s?.name ?? null, organizerId: u.organizerId ?? null,
    brandName: body.brandName ?? db.organizers.find((o) => o.id === u.organizerId)?.brandName ?? "",
    contactPhone: body.contactPhone ?? u.phone, businessInfo: body.businessInfo ?? null,
    startDate: body.startDate || null, endDate: body.endDate || null, status: "Pending", createdAt: now(), ...extra,
  };
  db.registrations.unshift(reg);
  registrationOwners[reg.id] = u.id;
  return reg;
};
on("GET", "/organizer-registrations", ({ me, q }) => {
  need(me, "Manager");
  return paged(
    db.registrations.filter((r) => (!q.get("type") || r.type === q.get("type")) && (!q.get("status") || r.status === q.get("status")) && matches(q, r.brandName, r.userFullName, r.stallCode)),
    q,
  );
});
on("GET", "/organizer-registrations/me", ({ me, q }) => paged(db.registrations.filter((r) => registrationOwners[r.id] === need(me).id), q));
on("POST", "/organizer-registrations", ({ me, body }) => newRegistration(need(me), body));
on("POST", "/organizer-registrations/additional-stalls", ({ me, body }) =>
  (body.stallIds as string[]).map((stallId) => newRegistration(need(me), { ...body, type: "Stall", stallId })),
);
on("POST", "/organizer-registrations/additional-online", ({ me }) => newRegistration(need(me), { type: "Online" }));
on("PUT", "/organizer-registrations/:id/approve", ({ m, body }) => {
  const reg = find(db.registrations, m[1], "Organizer registration");
  if (reg.status !== "Pending") throw new HttpError(409, "Only pending registrations can be approved.");
  if (reg.type === "Online" && body.commissionRate == null) throw new HttpError(400, "Commission rate is required.");
  return Object.assign(reg, { status: "AwaitingConfirmation", reviewedAt: now(), commissionRate: body.commissionRate ?? null });
});
on("PUT", "/organizer-registrations/:id/reject", ({ m, body }) => {
  const reg = find(db.registrations, m[1], "Organizer registration");
  if (reg.status !== "Pending") throw new HttpError(409, "Only pending registrations can be rejected.");
  return Object.assign(reg, { status: "Rejected", reviewedAt: now(), rejectReason: body.rejectReason });
});
on("PUT", "/organizer-registrations/:id/confirm", ({ me, m }) => {
  const reg = find(db.registrations, m[1], "Organizer registration");
  confirmRegistration(reg, registrationOwners[reg.id] ?? need(me).id);
  return Object.assign(reg, { status: "Approved", confirmedAt: now() });
});
on("PUT", "/organizer-registrations/:id/cancel", ({ m, body }) => {
  const reg = find(db.registrations, m[1], "Organizer registration");
  if (!["Pending", "AwaitingConfirmation"].includes(reg.status)) throw new HttpError(409, "This registration cannot be cancelled.");
  return Object.assign(reg, { status: "Cancelled", cancelledAt: now(), cancelReason: body.cancelReason });
});

// organizers
on("GET", "/organizers", ({ me, q }) => {
  need(me, "Manager");
  return paged(db.organizers.filter((o) => (!q.get("status") || o.status === q.get("status")) && matches(q, o.brandName, o.userFullName)), q);
});
on("GET", "/organizers/me", ({ me }) => myOrganizer(me));
on("PUT", "/organizers/me", ({ me, body }) => Object.assign(myOrganizer(me), body, { updatedAt: now() }));
on("GET", "/organizers/:id", ({ m }) => find(db.organizers, m[1], "Organizer"));
on("PUT", "/organizers/:id/status", ({ m, body }) => {
  const o = find(db.organizers, m[1], "Organizer");
  if (o.status === body.status) throw new HttpError(409, `Organizer is already ${body.status}.`);
  return Object.assign(o, body.status === "Suspended" ? { status: "Suspended", suspendReason: body.reason, suspendedAt: now() } : { status: "Active", suspendReason: null, suspendedAt: null });
});

// notifications
const mine = (u: MockUser) => db.notifications.filter((n) => n.userId === u.id).map((n) => n.value);
on("GET", "/notifications", ({ me, q }) => {
  const read = q.get("isRead");
  return paged(mine(need(me)).filter((n) => read == null || String(n.isRead) === read), q);
});
on("GET", "/notifications/unread-count", ({ me }) => ({ unreadCount: mine(need(me)).filter((n) => !n.isRead).length }));
on("PUT", "/notifications/read", ({ me }) => void mine(need(me)).forEach((n) => (n.isRead = true)));
on("PUT", "/notifications/:id/read", ({ me, m }) => void mine(need(me)).filter((n) => n.id === m[1]).forEach((n) => (n.isRead = true)));

// feedbacks
on("GET", "/feedbacks", ({ me, q }) => {
  const list = db.feedbacks.filter(
    (f) =>
      (me?.role === "Manager" || f.status === "Visible") &&
      (!q.get("productId") || f.productId === q.get("productId")) &&
      (!q.get("boxItemId") || f.boxItemId === q.get("boxItemId")) &&
      (!q.get("rating") || f.rating === Number(q.get("rating"))) &&
      (!q.get("status") || f.status === q.get("status")),
  );
  const averageRating = list.length ? Math.round((list.reduce((n, f) => n + f.rating, 0) / list.length) * 10) / 10 : null;
  return { pagination: paged(list.sort(byNewest), q), averageRating };
});
on("GET", "/feedbacks/organizer", ({ me, q }) => {
  const o = myOrganizer(me);
  return paged(db.feedbacks.filter((f) => f.organizerBrandName === o.brandName), q);
});
on("POST", "/feedbacks", ({ me, body }) => {
  const u = need(me);
  const order = db.orders.find((o) => o.items.some((i) => i.id === body.orderItemId));
  const item = order?.items.find((i) => i.id === body.orderItemId);
  if (!order || !item) throw new HttpError(404, "Order item not found.");
  const f = {
    id: db.nextId("fb"), orderItemId: item.id, userName: u.fullName, organizerBrandName: order.organizerBrandName,
    productId: item.productId, productName: item.itemType === "Product" ? item.name : null,
    boxItemId: item.boxItemId, boxItemName: item.itemType === "Box" ? item.name : null,
    rating: Number(body.rating), comment: body.comment, status: "Visible" as const, imageUrls: [], createdAt: now(),
  };
  db.feedbacks.unshift(f);
  return f;
});
on("PUT", "/feedbacks/:id/reply", ({ m, body }) => Object.assign(find(db.feedbacks, m[1], "Feedback"), { replyContent: body.replyContent, repliedAt: now() }));
on("PUT", "/feedbacks/:id/status", ({ m, body }) => Object.assign(find(db.feedbacks, m[1], "Feedback"), { status: body.status }));

// ---- fetch adapter ----

const camel = (key: string) => key.charAt(0).toLowerCase() + key.slice(1);

async function readBody(init?: RequestInit): Promise<Body> {
  const raw = init?.body;
  if (raw instanceof FormData) return Object.fromEntries([...raw.entries()].map(([k, v]) => [camel(k), v]));
  if (typeof raw === "string" && raw) return JSON.parse(raw);
  return {};
}

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });

// Same signature as fetch: the API client swaps it in when mock mode is on.
export async function mockFetch(input: string, init?: RequestInit): Promise<Response> {
  await new Promise((r) => setTimeout(r, 120 + Math.random() * 180));
  const url = new URL(input, window.location.origin);
  const path = url.pathname.replace(/^.*?\/api(?=\/)/, "");
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = new Headers(init?.headers);
  const me = userFromToken(headers.get("Authorization"));

  for (const [m, re, handler] of routes) {
    const match = path.match(re);
    if (m !== method || !match) continue;
    try {
      const data = handler({ m: match, q: url.searchParams, body: await readBody(init), me });
      return json(200, ok(data));
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      const message = e instanceof Error ? e.message : "Mock server error";
      return json(status, { isSuccess: false, error: { code: String(status), message } });
    }
  }
  return json(404, { isSuccess: false, error: { code: "404", message: `Mock: no route for ${method} ${path}` } });
}
