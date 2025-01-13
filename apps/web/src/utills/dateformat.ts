import dayjs from "dayjs";

export function format(date: string | undefined) {
  const dateFormat = dayjs(date).format("YYYY-MM-DD");
  return dateFormat;
}