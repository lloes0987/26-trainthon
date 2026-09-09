import { redirect } from "next/navigation";

export default function CreateDatePage() {
  redirect("/create/time?dateOnly=1");
}
