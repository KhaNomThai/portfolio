import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; /** ไม่ใส่ = ส่วนที่พังหายไปเฉย ๆ */ fallback?: ReactNode };

/** กันไม่ให้ component เดียวที่ throw ทำให้ React ถอดทั้งหน้าเป็นหน้าขาว (ต้องเป็น class: React ไม่มี hook สำหรับเรื่องนี้) */
export default class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
