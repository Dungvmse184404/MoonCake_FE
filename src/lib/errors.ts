import { ApiError } from "./api";

const KNOWN: Array<[RegExp, string | ((m: RegExpMatchArray) => string)]> = [
  [/stall is currently rented/i, "Gian hàng này đang có người thuê."],
  [/already have a pending registration for this stall/i, "Bạn đã có đơn đang chờ duyệt cho gian hàng này."],
  [/already have an online registration/i, "Bạn đã có đơn bán online đang xử lý hoặc đã có hiệu lực."],
  [/stall not found/i, "Không tìm thấy gian hàng."],
  [/start date must not be in the past/i, "Ngày bắt đầu không được ở quá khứ."],
  [/end date must be after start date/i, "Ngày kết thúc phải sau ngày bắt đầu."],
  [/only pending registrations can be cancelled|cannot be cancelled/i, "Đơn ở trạng thái này không thể hủy."],
  [/organizer registration not found/i, "Không tìm thấy đơn đăng ký."],
  [/organizer not found/i, "Không tìm thấy hồ sơ Organizer."],
  [/your organizer account is suspended/i, "Tài khoản Organizer của bạn đang bị đình chỉ."],
  [/product not found/i, "Không tìm thấy sản phẩm."],
  [/at least one category/i, "Vui lòng chọn ít nhất một danh mục."],
  [/at least one filling/i, "Vui lòng chọn ít nhất một loại nhân."],
  [/stall (with )?code .* already exists|stall code already exists/i, "Mã gian hàng đã tồn tại."],
  [/cannot delete a stall that is currently rented/i, "Gian hàng đang được thuê nên không thể xóa."],
  [/already exists|duplicate/i, "Tên này đã tồn tại."],
  [/stall is already rented from (\S+) to (\S+)/i, "Gian hàng đã có người thuê trong khoảng thời gian này."],
  [/stalls are already rented between/i, "Một số gian hàng đã có người thuê trong khoảng thời gian này."],
  [/already have a pending registration for stalls/i, "Bạn đã có đơn đang chờ duyệt cho một số gian hàng đã chọn."],
  [/suspended and cannot/i, "Tài khoản Organizer đang bị đình chỉ nên không thể đăng ký thêm."],
  [/commission rate is required/i, "Cần nhập tỷ lệ hoa hồng cho đơn bán online."],
  [/organizer is already/i, "Organizer đã ở trạng thái này."],
  [/only pending registrations can be (approved|rejected)/i, "Chỉ đơn đang chờ duyệt mới xử lý được."],
  [/only an active stall rental can be terminated/i, "Chỉ hợp đồng đang thuê mới chấm dứt được."],
  [/insufficient stock for product '(.+)'\. available: (\d+)/i, (m) => `"${m[1]}" chỉ còn ${m[2]} sản phẩm trong kho.`],
  [/is not available for purchase/i, "Sản phẩm hiện không còn bán."],
  [/update your (full name|phone number|address) in your profile/i, "Vui lòng cập nhật họ tên, số điện thoại và địa chỉ trong hồ sơ trước khi đặt hàng."],
  [/only cancel pending orders/i, "Chỉ hủy được đơn đang chờ xác nhận."],
  [/only pending or confirmed orders can be cancelled/i, "Chỉ hủy được đơn đang chờ xác nhận hoặc đã xác nhận."],
  [/review an item of a delivered order/i, "Chỉ đánh giá được sản phẩm của đơn đã giao."],
  [/already been reviewed/i, "Sản phẩm này đã được đánh giá."],
  [/total selection quantity must equal box capacity \((\d+)\)/i, (m) => `Số bánh chọn phải đúng bằng sức chứa của hộp (${m[1]}).`],
  [/at least one box selection/i, "Vui lòng chọn bánh cho hộp."],
  [/is sold online and cannot be assigned to a stall/i, "Sản phẩm này bán online, không chọn gian hàng."],
  [/is not assigned to/i, "Gian hàng đã chọn không bán sản phẩm này."],
  [/currently rented \(active\) by your organizer/i, "Chỉ chọn được gian hàng bạn đang thuê."],
  [/forbidden/i, "Bạn không có quyền thực hiện thao tác này."],
];

export function friendlyError(error: unknown): string {
  if (!(error instanceof ApiError)) return "Không thể kết nối tới máy chủ.";
  for (const [pattern, text] of KNOWN) {
    const match = error.message.match(pattern);
    if (match) return typeof text === "function" ? text(match) : text;
  }
  return error.message;
}
