export type WeightedEdge = { from: number; to: number; weight: number };

/**
 * ลำดับเส้นที่ Prim เลือกเมื่อเริ่มจาก startId: แต่ละรอบเอาเส้นที่เบาที่สุดที่เชื่อมต้นไม้กับ vertex นอกต้นไม้
 * from = ฝั่งที่อยู่ในต้นไม้แล้ว, to = vertex ที่เพิ่งเข้าต้นไม้ ถ้ากราฟไม่เชื่อมกันทั้งหมดจะได้เส้นน้อยกว่า vertexCount − 1
 * check:data ใช้ฟังก์ชันนี้ตรวจกราฟใน labFigure ด้วย
 */
export function primOrder<E extends WeightedEdge>(startId: number, vertexCount: number, edges: E[]) {
  const inTree = new Set([startId]);
  const order: { edge: E; from: number; to: number }[] = [];
  while (inTree.size < vertexCount) {
    const next = edges
      .filter((e) => inTree.has(e.from) !== inTree.has(e.to))
      .reduce<E | undefined>((best, e) => (!best || e.weight < best.weight ? e : best), undefined);
    if (!next) break;
    const from = inTree.has(next.from) ? next.from : next.to;
    const to = from === next.from ? next.to : next.from;
    order.push({ edge: next, from, to });
    inTree.add(to);
  }
  return order;
}
