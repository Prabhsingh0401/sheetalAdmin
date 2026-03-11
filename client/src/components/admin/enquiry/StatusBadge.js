import { STATUS_STYLES, STATUS_ICONS } from "./enquiryConstants.js";

export default function StatusBadge({ status }) {
  const Icon = STATUS_ICONS[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${STATUS_STYLES[status]}`}
    >
      <Icon size={10} />
      {status}
    </span>
  );
}