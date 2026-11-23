const formatMoney = (amount) =>
  new Intl.NumberFormat("vi-VN").format(amount) + "đ";

export default formatMoney;
