/** <dialog> ที่เปิดด้วย showModal อยู่ top layer: z-index ใดก็ขึ้นไม่ถึง และทุกอย่างนอกมันเป็น inert ของชั่วคราวจึงต้องไปอยู่ใน dialog บนสุด */
export const topDialog = () => [...document.querySelectorAll("dialog[open]")].at(-1);

/** ปิดจากชั้นบนเพื่อให้ focus กลับถึงต้นทางก่อนเปลี่ยน route */
export function closeAuxiliaryDialogs() {
  for (const dialog of [...document.querySelectorAll<HTMLDialogElement>("dialog[data-aux-dialog][open]")].reverse()) {
    dialog.close();
  }
}
