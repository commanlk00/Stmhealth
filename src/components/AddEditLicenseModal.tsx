import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  Building2,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  FileSpreadsheet,
  Search,
  ShieldAlert,
  Flame,
  Check,
  Tag,
  Info,
  Layers,
  ChevronRight,
  Edit3,
} from 'lucide-react';
import {
  BusinessCategory,
  FoodEstablishmentSubtype,
  LicenseRecord,
  UploadedDocument,
  HazardousBusinessGroup,
  HazardousBusinessTypeItem,
} from '../types';
import { CATEGORY_REQUIREMENTS } from '../data/categoryRequirements';
import {
  HAZARDOUS_BUSINESS_GROUPS,
  POPULAR_HAZARDOUS_TYPES,
  searchHazardousBusinesses,
  findHazardousTypeByCode,
} from '../data/hazardousBusinessData';
import { formatCurrency } from '../utils/licenseUtils';

interface AddEditLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLicense: (license: LicenseRecord, isEditing: boolean) => Promise<void>;
  hasGoogleSheetConnected: boolean;
  licenseToEdit?: LicenseRecord | null;
}

export const AddEditLicenseModal: React.FC<AddEditLicenseModalProps> = ({
  isOpen,
  onClose,
  onSaveLicense,
  hasGoogleSheetConnected,
  licenseToEdit,
}) => {
  if (!isOpen) return null;

  // Form states
  const [category, setCategory] = useState<BusinessCategory>('FOOD_ESTABLISHMENT');
  const [areaSquareMeters, setAreaSquareMeters] = useState<number>(180);
  const [licenseNo, setLicenseNo] = useState<string>(`สธ-${Math.floor(1000 + Math.random() * 9000)}/2569`);
  const [businessName, setBusinessName] = useState<string>('');
  const [ownerFullName, setOwnerFullName] = useState<string>('');
  const [ownerNationalId, setOwnerNationalId] = useState<string>('');
  const [idCardAddress, setIdCardAddress] = useState<string>('');
  const [businessAddress, setBusinessAddress] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Default 1 year validity
  const defaultExp = new Date();
  defaultExp.setFullYear(defaultExp.getFullYear() + 1);
  const [expiryDate, setExpiryDate] = useState<string>(defaultExp.toISOString().split('T')[0]);

  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [ocrScanning, setOcrScanning] = useState<boolean>(false);
  const [syncToSheet, setSyncToSheet] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadingDocId, setCurrentUploadingDocId] = useState<string>('');

  // Hazardous business category states
  const [hazardousGroupCode, setHazardousGroupCode] = useState<string>('group-6');
  const [hazardousTypeCode, setHazardousTypeCode] = useState<string>('6(1)');
  const [hazardousSearchQuery, setHazardousSearchQuery] = useState<string>('');
  const [selectedQuickPick, setSelectedQuickPick] = useState<string>('6(1)');

  // Sync form state when modal opens or licenseToEdit changes
  useEffect(() => {
    if (!isOpen) return;

    if (licenseToEdit) {
      setCategory(licenseToEdit.category);
      setAreaSquareMeters(licenseToEdit.areaSquareMeters || 180);
      setLicenseNo(licenseToEdit.licenseNo);
      setBusinessName(licenseToEdit.businessName);
      setOwnerFullName(licenseToEdit.ownerFullName);
      setOwnerNationalId(licenseToEdit.ownerNationalId);
      setIdCardAddress(licenseToEdit.idCardAddress);
      setBusinessAddress(licenseToEdit.businessAddress);
      setContactPhone(licenseToEdit.contactPhone || '');
      setContactEmail(licenseToEdit.contactEmail || '');
      setIssueDate(licenseToEdit.issueDate);
      setExpiryDate(licenseToEdit.expiryDate);
      setUploadedDocs(licenseToEdit.documents || []);
      setSyncToSheet(licenseToEdit.syncedToSheet ?? true);

      if (licenseToEdit.category === 'HAZARDOUS_HEALTH') {
        const grp = licenseToEdit.hazardousGroupCode || 'group-6';
        const typ = licenseToEdit.hazardousTypeCode || '6(1)';
        setHazardousGroupCode(grp);
        setHazardousTypeCode(typ);
        setSelectedQuickPick(typ);
      }
    } else {
      setCategory('FOOD_ESTABLISHMENT');
      setAreaSquareMeters(180);
      setLicenseNo(`สธ-${Math.floor(1000 + Math.random() * 9000)}/2569`);
      setBusinessName('');
      setOwnerFullName('');
      setOwnerNationalId('');
      setIdCardAddress('');
      setBusinessAddress('');
      setContactPhone('');
      setContactEmail('');
      setIssueDate(new Date().toISOString().split('T')[0]);
      const defaultExp = new Date();
      defaultExp.setFullYear(defaultExp.getFullYear() + 1);
      setExpiryDate(defaultExp.toISOString().split('T')[0]);
      setUploadedDocs([]);
      setSyncToSheet(true);
      setHazardousGroupCode('group-6');
      setHazardousTypeCode('6(1)');
      setSelectedQuickPick('6(1)');
      setHazardousSearchQuery('');
    }
  }, [isOpen, licenseToEdit]);

  const selectedHazardousGroup =
    HAZARDOUS_BUSINESS_GROUPS.find((g) => g.id === hazardousGroupCode) ||
    HAZARDOUS_BUSINESS_GROUPS[5]; // default group-6

  const selectedHazardousType =
    selectedHazardousGroup.types.find((t) => t.code === hazardousTypeCode) ||
    selectedHazardousGroup.types[0];

  const searchResults = hazardousSearchQuery.trim()
    ? searchHazardousBusinesses(hazardousSearchQuery)
    : [];

  const handleSelectQuickPick = (item: (typeof POPULAR_HAZARDOUS_TYPES)[0]) => {
    setHazardousGroupCode(item.groupId);
    setHazardousTypeCode(item.code);
    setSelectedQuickPick(item.code);
    setHazardousSearchQuery('');
  };

  const handleSelectSearchResult = (result: ReturnType<typeof searchHazardousBusinesses>[0]) => {
    setHazardousGroupCode(result.groupId);
    setHazardousTypeCode(result.code);
    setSelectedQuickPick(result.code);
    setHazardousSearchQuery('');
  };

  // 7.2 Food rule determination: > 200 sqm vs <= 200 sqm
  const isFoodCategory = category === 'FOOD_ESTABLISHMENT';
  const foodSubtype: FoodEstablishmentSubtype =
    areaSquareMeters > 200 ? 'OVER_200_SQM' : 'UNDER_200_SQM';

  // Determine which rule applies
  const activeRuleKey = isFoodCategory
    ? foodSubtype === 'OVER_200_SQM'
      ? 'FOOD_ESTABLISHMENT_OVER_200'
      : 'FOOD_ESTABLISHMENT_UNDER_200'
    : category;

  const currentRule = CATEGORY_REQUIREMENTS[activeRuleKey] || CATEGORY_REQUIREMENTS.HAZARDOUS_HEALTH;

  // Handle OCR Autofill Demo to reduce manual entry errors as requested
  const handleOcrAutofill = () => {
    setOcrScanning(true);
    setTimeout(() => {
      setOcrScanning(false);
      if (category === 'HAZARDOUS_HEALTH') {
        setBusinessName('เจริญการช่าง ออโต้เพ้นท์ เซอร์วิส');
        setOwnerFullName('นายธีรภัทร อัครเดชานันท์');
        setOwnerNationalId('1100400892145');
        setHazardousGroupCode('group-6');
        setHazardousTypeCode('6(1)');
        setSelectedQuickPick('6(1)');
        setIdCardAddress('142/5 หมู่ 3 ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000');
        setBusinessAddress('88/12 ถนนรัตนาธิเบศร์ ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000');
        setContactPhone('081-456-7890');
        setContactEmail('teerapat.charoenauto@gmail.com');
      } else {
        setBusinessName('ร้านสยามดีไลท์ บิสโทร');
        setOwnerFullName('นางสาวณัฐธิดา ศิริโรจน์กุล');
        setOwnerNationalId('1103700482915');
        setIdCardAddress('128/4 หมู่ 2 ต.คลองหก อ.คลองหลวง จ.ปทุมธานี 12120');
        setBusinessAddress('55/8 ถนนพหลโยธิน ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120');
        setContactPhone('089-445-6677');
        setContactEmail('nutthida.siamdelight@gmail.com');
        setAreaSquareMeters(240); // Will trigger > 200 sqm!
      }
    }, 800);
  };

  const handleFileUpload = (docId: string, docTitle: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc: UploadedDocument = {
      id: `doc-${Date.now()}`,
      name: file.name,
      categoryRequirementId: docId,
      docTitle: docTitle,
      fileType: file.type.includes('pdf') ? 'pdf' : 'image',
      fileUrl: URL.createObjectURL(file),
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadDate: new Date().toISOString().split('T')[0],
      isVerified: true,
    };

    setUploadedDocs((prev) => [...prev.filter((d) => d.categoryRequirementId !== docId), newDoc]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !ownerFullName || !ownerNationalId) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    if (ownerNationalId.replace(/[^0-9]/g, '').length !== 13) {
      alert('เลขประจำตัวประชาชนต้องมีครบ 13 หลัก');
      return;
    }

    setIsSaving(true);

    const isHazardous = category === 'HAZARDOUS_HEALTH';
    const finalFee = isHazardous && selectedHazardousType
      ? selectedHazardousType.typicalFee
      : currentRule.standardAnnualFee;

    const finalCategoryLabel = isHazardous && selectedHazardousType
      ? `7.1 กิจการที่เป็นอันตรายต่อสุขภาพ [${selectedHazardousType.code} ${selectedHazardousType.shortName}]`
      : currentRule.title;

    const isEditing = Boolean(licenseToEdit);
    const targetLicense: LicenseRecord = {
      id: licenseToEdit ? licenseToEdit.id : `lic-${Date.now()}`,
      licenseNo: licenseNo,
      category: category,
      categoryLabel: finalCategoryLabel,
      foodSubtype: isFoodCategory ? foodSubtype : undefined,
      hazardousGroup: isHazardous ? selectedHazardousGroup.name : undefined,
      hazardousGroupCode: isHazardous ? selectedHazardousGroup.id : undefined,
      hazardousType: isHazardous && selectedHazardousType ? selectedHazardousType.name : undefined,
      hazardousTypeCode: isHazardous && selectedHazardousType ? selectedHazardousType.code : undefined,
      hazardousRiskLevel: isHazardous && selectedHazardousType ? selectedHazardousType.riskLevel : undefined,
      businessName: businessName,
      areaSquareMeters: isFoodCategory ? Number(areaSquareMeters) : undefined,
      ownerFullName: ownerFullName,
      ownerNationalId: ownerNationalId.replace(/[^0-9]/g, ''),
      idCardAddress: idCardAddress,
      businessAddress: businessAddress,
      contactPhone: contactPhone,
      contactEmail: contactEmail,
      issueDate: issueDate,
      expiryDate: expiryDate,
      feeAmount: finalFee,
      status: licenseToEdit ? licenseToEdit.status : 'active',
      documents: uploadedDocs,
      paymentStatus: licenseToEdit ? licenseToEdit.paymentStatus : 'paid',
      promptpayRef: licenseToEdit ? licenseToEdit.promptpayRef : undefined,
      paidAt: licenseToEdit ? licenseToEdit.paidAt : undefined,
      notification30DaysSent: licenseToEdit ? licenseToEdit.notification30DaysSent : false,
      lastNotifiedDate: licenseToEdit ? licenseToEdit.lastNotifiedDate : undefined,
      syncedToSheet: hasGoogleSheetConnected && syncToSheet,
      renewalHistory: licenseToEdit ? (licenseToEdit.renewalHistory || []) : [],
      eLicenseSignature: licenseToEdit ? licenseToEdit.eLicenseSignature : undefined,
      approvalStatus: licenseToEdit ? licenseToEdit.approvalStatus : undefined,
      approvedBy: licenseToEdit ? licenseToEdit.approvedBy : undefined,
      approvedAt: licenseToEdit ? licenseToEdit.approvedAt : undefined,
      notes: licenseToEdit ? licenseToEdit.notes : undefined,
    };

    try {
      await onSaveLicense(targetLicense, isEditing);
      setIsSaving(false);
      onClose();
    } catch (err) {
      console.error('Error saving license:', err);
      setIsSaving(false);
      alert('ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl ${licenseToEdit ? 'bg-indigo-600' : 'bg-blue-600'} flex items-center justify-center text-white font-bold`}>
              {licenseToEdit ? <Edit3 className="w-5 h-5" /> : '+'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  {licenseToEdit ? 'แก้ไขข้อมูลใบอนุญาตประกอบกิจการ' : 'ลงทะเบียน / ออกใบอนุญาตประกอบกิจการใหม่'}
                </h2>
                {licenseToEdit && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/40 text-indigo-200 border border-indigo-400/30">
                    โหมดแก้ไข
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {licenseToEdit
                  ? `แก้ไขข้อมูลสถานประกอบการและรายละเอียดผู้ขอ (เลขที่: ${licenseToEdit.licenseNo})`
                  : 'ระบบคัดกรองเงื่อนไขตาม พ.ร.บ. สาธารณสุข และเชื่อมโยง Google Sheets'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Banner for Edit Mode or OCR for New Mode */}
          {licenseToEdit ? (
            <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="text-xs text-indigo-900">
                  <span className="font-semibold">โหมดแก้ไขข้อมูลใบอนุญาต:</span>{' '}
                  ท่านสามารถปรับปรุงข้อมูลสถานประกอบการ, ที่อยู่, เบอร์โทร, ประเภทกิจการ, หรืออัปโหลดเอกสารใหม่ และกดบันทึกเพื่ออัปเดตระบบ
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded shrink-0">
                {licenseToEdit.licenseNo}
              </span>
            </div>
          ) : (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="text-xs text-blue-900">
                  <span className="font-semibold">ระบบช่วยกรอกข้อมูลอัตโนมัติ (Smart OCR):</span>{' '}
                  ลดความผิดพลาดจากการคีย์ข้อมูลด้วยมือ
                </div>
              </div>
              <button
                type="button"
                onClick={handleOcrAutofill}
                disabled={ocrScanning}
                className="px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs transition-colors shrink-0"
              >
                {ocrScanning ? 'กำลังวิเคราะห์เอกสาร...' : '⚡ ดึงข้อมูลตัวอย่าง'}
              </button>
            </div>
          )}

          {/* Section 1: ประเภทกิจการ (ตามข้อ 7.1 - 7.4) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              เลือกประเภทกิจการตามข้อกำหนดกฎหมาย
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  category === 'HAZARDOUS_HEALTH'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value="HAZARDOUS_HEALTH"
                  checked={category === 'HAZARDOUS_HEALTH'}
                  onChange={() => setCategory('HAZARDOUS_HEALTH')}
                  className="hidden"
                />
                <div className="font-bold">7.1 กิจการที่เป็นอันตรายต่อสุขภาพ</div>
                <div className="text-[11px] text-slate-500 mt-0.5">โรงงาน อู่พ่นสี โรงแรม คาร์แคร์</div>
              </label>

              <label
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  category === 'FOOD_ESTABLISHMENT'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value="FOOD_ESTABLISHMENT"
                  checked={category === 'FOOD_ESTABLISHMENT'}
                  onChange={() => setCategory('FOOD_ESTABLISHMENT')}
                  className="hidden"
                />
                <div className="font-bold">7.2 สถานที่จำหน่ายหรือสะสมอาหาร</div>
                <div className="text-[11px] text-slate-500 mt-0.5">แบ่งตามเกณฑ์พื้นที่ 200 ตารางเมตร</div>
              </label>

              <label
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  category === 'MARKET'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value="MARKET"
                  checked={category === 'MARKET'}
                  onChange={() => setCategory('MARKET')}
                  className="hidden"
                />
                <div className="font-bold">7.3 กิจการตลาด</div>
                <div className="text-[11px] text-slate-500 mt-0.5">ตลาดสดประเภทที่ 1 และ 2</div>
              </label>

              <label
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  category === 'WASTE_MANAGEMENT'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value="WASTE_MANAGEMENT"
                  checked={category === 'WASTE_MANAGEMENT'}
                  onChange={() => setCategory('WASTE_MANAGEMENT')}
                  className="hidden"
                />
                <div className="font-bold">7.4 กิจการเก็บ ขน หรือกำจัดสิ่งปฏิกูล/มูลฝอย</div>
                <div className="text-[11px] text-slate-500 mt-0.5">บริการขนถ่ายขยะ สิ่งปฏิกูล</div>
              </label>
            </div>

            {/* Condition 7.1 กิจการที่เป็นอันตรายต่อสุขภาพ Selection Panel */}
            {category === 'HAZARDOUS_HEALTH' && (
              <div className="p-4 bg-white rounded-xl border border-blue-200 space-y-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs sm:text-sm">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>ตัวเลือกหมวดและประเภทกิจการที่เป็นอันตรายต่อสุขภาพ</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                    พ.ร.บ. การสาธารณสุข ๑๓ หมวด
                  </span>
                </div>

                {/* Search Bar for 13 Groups */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={hazardousSearchQuery}
                    onChange={(e) => setHazardousSearchQuery(e.target.value)}
                    placeholder="พิมพ์ค้นหากิจการ เช่น พ่นสี, คาร์แคร์, หอพัก, ปั๊มน้ำมัน, สุกร, ไก่, โรงสี, ซักรีด..."
                    className="w-full pl-8 pr-8 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  {hazardousSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setHazardousSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Search Results Dropdown/Box */}
                  {hazardousSearchQuery.trim() && (
                    <div className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-200 p-1 text-xs space-y-1">
                      <div className="p-1.5 text-[11px] text-slate-500 font-medium bg-slate-50 rounded">
                        พบ {searchResults.length} รายการที่ตรงกับ "{hazardousSearchQuery}"
                      </div>
                      {searchResults.length === 0 ? (
                        <div className="p-3 text-center text-slate-400 text-xs">
                          ไม่พบกิจการที่ตรงกับคำค้นหา
                        </div>
                      ) : (
                        searchResults.map((res) => (
                          <button
                            key={`${res.groupId}-${res.code}`}
                            type="button"
                            onClick={() => handleSelectSearchResult(res)}
                            className="w-full text-left p-2 rounded-md hover:bg-blue-50 flex items-start justify-between gap-2 border border-transparent hover:border-blue-200 transition-colors"
                          >
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-mono">
                                  {res.code}
                                </span>
                                <span>{res.shortName}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {res.name}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {res.groupName}
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-700 whitespace-nowrap shrink-0">
                              {formatCurrency(res.typicalFee)}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Picks (10 Most Popular Businesses) */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>กิจการยอดนิยมที่พบบ่อย (คลิกเลือกด่วน):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {POPULAR_HAZARDOUS_TYPES.map((item) => {
                      const isSelected =
                        hazardousGroupCode === item.groupId && hazardousTypeCode === item.code;
                      return (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => handleSelectQuickPick(item)}
                          className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                        >
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                            {item.code}
                          </span>
                          <span>{item.shortName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2-Step Dropdowns: หมวด (13 หมวด) & กิจการย่อย */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      ๑. เลือกหมวดกิจการ (13 หมวดตามกฎหมาย):
                    </label>
                    <select
                      value={hazardousGroupCode}
                      onChange={(e) => {
                        const newGroupId = e.target.value;
                        setHazardousGroupCode(newGroupId);
                        const group = HAZARDOUS_BUSINESS_GROUPS.find((g) => g.id === newGroupId);
                        if (group && group.types.length > 0) {
                          setHazardousTypeCode(group.types[0].code);
                          setSelectedQuickPick(group.types[0].code);
                        }
                      }}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-white focus:ring-1 focus:ring-blue-500"
                    >
                      {HAZARDOUS_BUSINESS_GROUPS.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({group.types.length} ประเภท)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      ๒. เลือกประเภทกิจการย่อย:
                    </label>
                    <select
                      value={hazardousTypeCode}
                      onChange={(e) => {
                        setHazardousTypeCode(e.target.value);
                        setSelectedQuickPick(e.target.value);
                      }}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-white focus:ring-1 focus:ring-blue-500"
                    >
                      {selectedHazardousGroup.types.map((type) => (
                        <option key={type.code} value={type.code}>
                          {type.code} {type.shortName} - {formatCurrency(type.typicalFee)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selected Item Highlights & Requirements Box */}
                {selectedHazardousType && (
                  <div className="p-3 bg-gradient-to-r from-blue-50/80 to-slate-50 rounded-xl border border-blue-200/80 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-blue-200/60">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-700 text-white">
                            รหัส {selectedHazardousType.code}
                          </span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {selectedHazardousType.shortName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1 leading-snug">
                          {selectedHazardousType.name}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            selectedHazardousType.riskLevel === 'HIGH'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : selectedHazardousType.riskLevel === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {selectedHazardousType.riskLevel === 'HIGH' && '⚠️ ความเสี่ยงสูง'}
                          {selectedHazardousType.riskLevel === 'MEDIUM' && '⚡ ความเสี่ยงปานกลาง'}
                          {selectedHazardousType.riskLevel === 'LOW' && '✓ ความเสี่ยงต่ำ'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {formatCurrency(selectedHazardousType.typicalFee)}/ปี
                        </span>
                      </div>
                    </div>

                    {/* Specific Sanitation & Pollution Control Requirements */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>เกณฑ์การตรวจประเมินสุขาภิบาลและควบคุมมลพิษเฉพาะกิจการ:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-1">
                        {selectedHazardousType.keySanitationRequirements.map((req, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-1.5 text-[11px] text-slate-700 bg-white/80 p-1.5 rounded border border-slate-200/80"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {isFoodCategory && (
              <div className="p-3 bg-white rounded-lg border border-blue-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700">
                    ขนาดพื้นที่สถานประกอบการ (ตารางเมตร):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={areaSquareMeters}
                      onChange={(e) => setAreaSquareMeters(Number(e.target.value))}
                      className="w-28 p-1.5 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-800 text-right"
                    />
                    <span className="text-xs text-slate-500">ตร.ม.</span>
                  </div>
                </div>

                {/* Auto Calculated Decision Notice */}
                <div
                  className={`p-2.5 rounded-md text-xs border ${
                    areaSquareMeters > 200
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {areaSquareMeters > 200
                      ? '7.2.1 พื้นที่เกิน 200 ตร.ม. : ระบบกำหนดเป็น "ใบอนุญาตจัดตั้งสถานที่จำหน่ายอาหาร"'
                      : '7.2.2 พื้นที่ไม่เกิน 200 ตร.ม. : ระบบกำหนดเป็น "หนังสือรับรองการแจ้ง"'}
                  </div>
                  <div className="text-[11px] mt-0.5 opacity-90">
                    อัตราค่าธรรมเนียมตามระเบียบ:{' '}
                    <span className="font-semibold">{formatCurrency(currentRule.standardAnnualFee)}</span> ต่อปี
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: ข้อมูลผู้ขอและสถานประกอบการ (ตามข้อ 1) */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" /> ข้อมูลผู้ประกอบการและที่อยู่
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ - นามสกุล ผู้ถือใบอนุญาต <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ownerFullName}
                  onChange={(e) => setOwnerFullName(e.target.value)}
                  placeholder="เช่น นายสมศักดิ์ วัฒนากิจโกศล"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเลขบัตรประชาชน (13 หลัก) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={17}
                  value={ownerNationalId}
                  onChange={(e) => setOwnerNationalId(e.target.value)}
                  placeholder="เช่น 1100400892145"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ที่อยู่ตามบัตรประจำตัวประชาชน <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={idCardAddress}
                onChange={(e) => setIdCardAddress(e.target.value)}
                placeholder="เช่น 142/5 หมู่ 3 ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อสถานประกอบการ / ร้านค้า <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="เช่น ร้านอาหารชาวเกาะ ริมน้ำ"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเลขใบอนุญาต / เลขคำขอ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ที่อยู่สถานประกอบการ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="เช่น 88/12 ถนนรัตนาธิเบศร์ ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="เช่น 081-456-7890"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อีเมล (สำหรับแจ้งเตือนล่วงหน้า 30 วัน)
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="เช่น owner@example.com"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่ออกใบอนุญาต
                </label>
                <input
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันหมดอายุ (มีอายุ 1 ปี นับแต่วันที่ออก)
                </label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-rose-700"
                />
              </div>
            </div>
          </div>

          {/* Section 3: อัปโหลดเอกสารออนไลน์ตาม Checklist (ข้อ 7.5) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                อัปโหลดเอกสารดิจิทัลประกอบคำขอ ({currentRule.documentChecklist.length} รายการ)
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                รองรับไฟล์ PDF และรูปภาพความละเอียดสูงเพื่อความสะดวกในการตรวจสอบ
              </p>
            </div>

            <div className="space-y-2">
              {currentRule.documentChecklist.map((item) => {
                const uploaded = uploadedDocs.find((d) => d.categoryRequirementId === item.docId);

                return (
                  <div
                    key={item.docId}
                    className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.isRequired && (
                          <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            บังคับ
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{item.description}</div>
                      {uploaded && (
                        <div className="text-[11px] text-emerald-700 font-medium mt-1">
                          ✓ แนบแล้ว: {uploaded.name} ({uploaded.fileSize})
                        </div>
                      )}
                    </div>

                    <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer shrink-0 transition-colors flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploaded ? 'เปลี่ยนไฟล์' : 'อัปโหลด'}</span>
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(item.docId, item.name, e)}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sync to Google Sheets toggle */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="syncNewToSheet"
              checked={syncToSheet}
              onChange={(e) => setSyncToSheet(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="syncNewToSheet" className="text-xs text-emerald-950 cursor-pointer">
              <div className="font-bold flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                ซิงค์ข้อมูลไปยังฐานข้อมูลหลัก Google Sheets ทันที
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                {hasGoogleSheetConnected
                  ? 'ข้อมูลจะถูกส่งเข้า Google Spreadsheet อัตโนมัติ ป้องกันข้อมูลตกหล่น'
                  : 'เมื่อเชื่อมต่อบัญชี Google ข้อมูลจะถูกซิงค์เข้าระบบ'}
              </p>
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-5 py-2 rounded-lg text-xs font-semibold ${
                licenseToEdit
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } shadow-xs flex items-center gap-1.5 transition-colors`}
            >
              {isSaving
                ? 'กำลังบันทึก...'
                : licenseToEdit
                ? '💾 บันทึกการแก้ไขข้อมูล'
                : 'บันทึกใบอนุญาตประกอบกิจการ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
