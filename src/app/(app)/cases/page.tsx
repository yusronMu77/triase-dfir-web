import { cases } from "../../../data/cases";
import { CaseListView } from "../../../features/case/case-list.view";

export default function Page() {
  return <CaseListView rows={cases} />;
}
