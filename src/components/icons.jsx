const BOOKMARK_PATH = 'M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z';
const TAG_PATH =
  'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z';
const LINK_PATH =
  'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1';

const Stroke = ({ size, strokeWidth = 2, d }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={d} />
  </svg>
);

export const BookmarkIcon = ({ size = 20 }) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path d={BOOKMARK_PATH} />
  </svg>
);

export const BookmarkOutlineIcon = ({ size = 40 }) => <Stroke size={size} strokeWidth={1.5} d={BOOKMARK_PATH} />;

export const TagIcon = ({ size = 16 }) => <Stroke size={size} d={TAG_PATH} />;

export const LinkIcon = ({ size = 16 }) => <Stroke size={size} d={LINK_PATH} />;

export const PlusIcon = ({ size = 16 }) => <Stroke size={size} strokeWidth={2.5} d="M12 4v16m8-8H4" />;

export const CloseIcon = ({ size = 14 }) => <Stroke size={size} strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />;

export const CheckIcon = ({ size = 14 }) => <Stroke size={size} strokeWidth={2.5} d="M5 13l4 4L19 7" />;

export const HashIcon = ({ size = 16 }) => <Stroke size={size} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />;

export const TitleIcon = ({ size = 16 }) => <Stroke size={size} d="M7 7h10M7 12h6" />;

export const SearchIcon = ({ size = 18 }) => (
  <Stroke size={size} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
);

export const ChevronDownIcon = ({ size = 18, className }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export const ExportIcon = ({ size = 16 }) => (
  <Stroke size={size} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
);

export const ImportIcon = ({ size = 16 }) => (
  <Stroke size={size} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 14l5-5m0 0l5 5m-5-5V4" />
);

export const ExternalIcon = ({ size = 15 }) => (
  <Stroke size={size} strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
);

export const EditIcon = ({ size = 15 }) => (
  <Stroke
    size={size}
    strokeWidth={2.5}
    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
  />
);

export const TrashIcon = ({ size = 15 }) => (
  <Stroke
    size={size}
    strokeWidth={2.5}
    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
  />
);

export const DragDotsIcon = () => (
  <svg width="20" height="10" viewBox="0 0 20 10" fill="currentColor" aria-hidden="true">
    <circle cx="2.5" cy="2.5" r="1.5" />
    <circle cx="10" cy="2.5" r="1.5" />
    <circle cx="17.5" cy="2.5" r="1.5" />
    <circle cx="2.5" cy="7.5" r="1.5" />
    <circle cx="10" cy="7.5" r="1.5" />
    <circle cx="17.5" cy="7.5" r="1.5" />
  </svg>
);
