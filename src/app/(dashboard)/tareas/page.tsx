import { Suspense } from "react";
import TareasClient from "./TareasClient";

export default function Page() {
  return (
    <Suspense>
      <TareasClient />
    </Suspense>
  );
}