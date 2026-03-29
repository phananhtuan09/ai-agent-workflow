import type { ReactNode } from "react";

export function MdxContent({ children }: { children: ReactNode }) {
  return <article>{children}</article>;
}
