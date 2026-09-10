import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import * as fas from '@fortawesome/free-solid-svg-icons';

export interface IconProps extends React.HTMLAttributes<HTMLElement> {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export type IconComponent = React.FC<IconProps>;

function makeFaIcon(iconDef: IconDefinition, isSpin = false): IconComponent {
  const Comp: React.FC<IconProps> = ({ size = 16, color, className = '', style = {}, ...props }) => {
    const dim = typeof size === 'number' ? `${size}px` : size;
    return (
      <FontAwesomeIcon
        icon={iconDef}
        spin={isSpin}
        className={className}
        style={{
          fontSize: dim,
          width: dim,
          height: dim,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(color ? { color } : {}),
          ...style,
        }}
        {...(props as any)}
      />
    );
  };
  Comp.displayName = `Fa_${iconDef.iconName}`;
  return Comp;
}

// 100% FontAwesome Solid Simgeler
export const Activity = makeFaIcon(fas.faChartLine);
export const AlertCircle = makeFaIcon(fas.faCircleExclamation);
export const AlertTriangle = makeFaIcon(fas.faTriangleExclamation);
export const ArrowDownRight = makeFaIcon(fas.faArrowDown);
export const ArrowLeft = makeFaIcon(fas.faArrowLeft);
export const ArrowRight = makeFaIcon(fas.faArrowRight);
export const ArrowUpRight = makeFaIcon(fas.faArrowUpRightFromSquare);
export const BadgeCheck = makeFaIcon(fas.faCertificate);
export const Banknote = makeFaIcon(fas.faMoneyBillWave);
export const BarChart3 = makeFaIcon(fas.faChartColumn);
export const Bell = makeFaIcon(fas.faBell);
export const Briefcase = makeFaIcon(fas.faBriefcase);
export const Building = makeFaIcon(fas.faBuilding);
export const Building2 = makeFaIcon(fas.faBuilding);
export const Calculator = makeFaIcon(fas.faCalculator);
export const Calendar = makeFaIcon(fas.faCalendar);
export const CalendarCheck = makeFaIcon(fas.faCalendarCheck);
export const CalendarClock = makeFaIcon(fas.faCalendarDays);
export const Camera = makeFaIcon(fas.faCamera);
export const Car = makeFaIcon(fas.faCar);
export const Check = makeFaIcon(fas.faCheck);
export const CheckCheck = makeFaIcon(fas.faCheckDouble);
export const CheckCircle = makeFaIcon(fas.faCircleCheck);
export const CheckCircle2 = makeFaIcon(fas.faCircleCheck);
export const ChevronDown = makeFaIcon(fas.faChevronDown);
export const ChevronLeft = makeFaIcon(fas.faChevronLeft);
export const ChevronRight = makeFaIcon(fas.faChevronRight);
export const ChevronUp = makeFaIcon(fas.faChevronUp);
export const Circle = makeFaIcon(fas.faCircle);
export const Clock = makeFaIcon(fas.faClock);
export const Coins = makeFaIcon(fas.faCoins);
export const Copy = makeFaIcon(fas.faCopy);
export const CreditCard = makeFaIcon(fas.faCreditCard);
export const Crown = makeFaIcon(fas.faCrown);
export const Database = makeFaIcon(fas.faDatabase);
export const DollarSign = makeFaIcon(fas.faDollarSign);
export const Download = makeFaIcon(fas.faDownload);
export const Edit = makeFaIcon(fas.faPenToSquare);
export const Edit3 = makeFaIcon(fas.faPenToSquare);
export const ExternalLink = makeFaIcon(fas.faArrowUpRightFromSquare);
export const Eye = makeFaIcon(fas.faEye);
export const EyeOff = makeFaIcon(fas.faEyeSlash);
export const FileCheck = makeFaIcon(fas.faFileCircleCheck);
export const FileCode = makeFaIcon(fas.faFileCode);
export const FileText = makeFaIcon(fas.faFileLines);
export const Filter = makeFaIcon(fas.faFilter);
export const Flame = makeFaIcon(fas.faFire);
export const Gift = makeFaIcon(fas.faGift);
export const Headphones = makeFaIcon(fas.faHeadset);
export const Home = makeFaIcon(fas.faHouse);
export const Image = makeFaIcon(fas.faImage);
export const Info = makeFaIcon(fas.faCircleInfo);
export const Key = makeFaIcon(fas.faKey);
export const KeyRound = makeFaIcon(fas.faKey);
export const Landmark = makeFaIcon(fas.faLandmark);
export const Layers = makeFaIcon(fas.faLayerGroup);
export const LayoutDashboard = makeFaIcon(fas.faGaugeHigh);
export const LayoutGrid = makeFaIcon(fas.faTableCellsLarge);
export const LifeBuoy = makeFaIcon(fas.faLifeRing);
export const LineChart = makeFaIcon(fas.faChartLine);
export const List = makeFaIcon(fas.faList);
export const Loader2 = makeFaIcon(fas.faSpinner, true);
export const Lock = makeFaIcon(fas.faLock);
export const LogOut = makeFaIcon(fas.faRightFromBracket);
export const Mail = makeFaIcon(fas.faEnvelope);
export const MapPin = makeFaIcon(fas.faLocationDot);
export const Maximize2 = makeFaIcon(fas.faExpand);
export const Megaphone = makeFaIcon(fas.faBullhorn);
export const Menu = makeFaIcon(fas.faBars);
export const MessageCircle = makeFaIcon(fas.faComment);
export const MessageSquare = makeFaIcon(fas.faCommentDots);
export const Network = makeFaIcon(fas.faNetworkWired);
export const Pencil = makeFaIcon(fas.faPen);
export const Phone = makeFaIcon(fas.faPhone);
export const PhoneCall = makeFaIcon(fas.faPhoneVolume);
export const PieChart = makeFaIcon(fas.faChartPie);
export const PiggyBank = makeFaIcon(fas.faPiggyBank);
export const Plus = makeFaIcon(fas.faPlus);
export const Printer = makeFaIcon(fas.faPrint);
export const QrCode = makeFaIcon(fas.faQrcode);
export const Receipt = makeFaIcon(fas.faReceipt);
export const RefreshCw = makeFaIcon(fas.faRotate);
export const RotateCcw = makeFaIcon(fas.faRotateLeft);
export const Save = makeFaIcon(fas.faFloppyDisk);
export const Scale = makeFaIcon(fas.faScaleBalanced);
export const Search = makeFaIcon(fas.faMagnifyingGlass);
export const Send = makeFaIcon(fas.faPaperPlane);
export const Server = makeFaIcon(fas.faServer);
export const Settings = makeFaIcon(fas.faGear);
export const Share2 = makeFaIcon(fas.faShareNodes);
export const Shield = makeFaIcon(fas.faShield);
export const ShieldAlert = makeFaIcon(fas.faShieldHalved);
export const ShieldCheck = makeFaIcon(fas.faShieldHalved);
export const Shuffle = makeFaIcon(fas.faShuffle);
export const Sliders = makeFaIcon(fas.faSliders);
export const SlidersHorizontal = makeFaIcon(fas.faSliders);
export const Smartphone = makeFaIcon(fas.faMobileScreen);
// Kullanıcının özellikle belirttiği gibi yapay zeka ikonu kaldırıldı; kurumsal etiket/rozet ikonu verildi.
export const Sparkles = makeFaIcon(fas.faTag);
export const Split = makeFaIcon(fas.faArrowsSplitUpAndLeft);
export const Store = makeFaIcon(fas.faStore);
export const Table = makeFaIcon(fas.faTable);
export const Trash2 = makeFaIcon(fas.faTrashCan);
export const TrendingDown = makeFaIcon(fas.faArrowTrendDown);
export const TrendingUp = makeFaIcon(fas.faArrowTrendUp);
export const Unlock = makeFaIcon(fas.faLockOpen);
export const Upload = makeFaIcon(fas.faUpload);
export const UploadCloud = makeFaIcon(fas.faCloudArrowUp);
export const User = makeFaIcon(fas.faUser);
export const UserCheck = makeFaIcon(fas.faUserCheck);
export const UserMinus = makeFaIcon(fas.faUserMinus);
export const UserPlus = makeFaIcon(fas.faUserPlus);
export const Users = makeFaIcon(fas.faUsers);
export const Users2 = makeFaIcon(fas.faUsers);
export const Video = makeFaIcon(fas.faVideo);
export const Wallet = makeFaIcon(fas.faWallet);
export const Wrench = makeFaIcon(fas.faWrench);
export const X = makeFaIcon(fas.faXmark);
export const XCircle = makeFaIcon(fas.faCircleXmark);
export const Zap = makeFaIcon(fas.faBolt);

// Lucide type compatibility
export interface LucideProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  className?: string;
}
export type LucideIcon = IconComponent;
