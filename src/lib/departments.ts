export interface DepartmentOption {
  id: string;
  nameTh: string;
  nameEn: string;
}

export const UNITHAI_DEPARTMENTS: DepartmentOption[] = [
  {
    id: 'People and Organization Value Management',
    nameTh: 'People and Organization Value Management (การบริหารคุณค่าบุคลากรและองค์กร)',
    nameEn: 'People and Organization Value Management',
  },
  {
    id: 'Administration',
    nameTh: 'Administration (ธุรการและบริหารทั่วไป)',
    nameEn: 'Administration',
  },
  {
    id: 'Asset Value-Added Management',
    nameTh: 'Asset Value-Added Management (การบริหารมูลค่าเพิ่มสินทรัพย์)',
    nameEn: 'Asset Value-Added Management',
  },
  {
    id: 'Management Information System',
    nameTh: 'Management Information System (MIS / ระบบสารสนเทศเพื่อการบริหาร)',
    nameEn: 'Management Information System',
  },
  {
    id: 'Warehouse, Logistics',
    nameTh: 'Warehouse, Logistics (คลังสินค้าและโลจิสติกส์)',
    nameEn: 'Warehouse, Logistics',
  },
  {
    id: 'Purchasing',
    nameTh: 'Purchasing (จัดซื้อ)',
    nameEn: 'Purchasing',
  },
  {
    id: 'Subcontracting',
    nameTh: 'Subcontracting (จัดจ้างผู้รับเหมาช่วง)',
    nameEn: 'Subcontracting',
  },
  {
    id: 'Health, Safety, Security and Environment',
    nameTh: 'Health, Safety, Security and Environment (HSSE / ความปลอดภัย อาชีวอนามัย และสิ่งแวดล้อม)',
    nameEn: 'Health, Safety, Security and Environment',
  },
  {
    id: 'QA/QC & LSS',
    nameTh: 'QA/QC & LSS (ควบคุมคุณภาพและลีนซิกส์ซิกมา)',
    nameEn: 'QA/QC & LSS',
  },
  {
    id: 'Yard Facilities and Yard Development',
    nameTh: 'Yard Facilities and Yard Development (สาธารณูปโภคและพัฒนาพื้นที่อู่)',
    nameEn: 'Yard Facilities and Yard Development',
  },
  {
    id: 'Quality, Sustainability and Innovation',
    nameTh: 'Quality, Sustainability and Innovation (คุณภาพ ความยั่งยืน และนวัตกรรม)',
    nameEn: 'Quality, Sustainability and Innovation',
  },
  {
    id: 'Ship / Project Management & Planning',
    nameTh: 'Ship / Project Management & Planning (บริหารโครงการซ่อมเรือและการวางแผน)',
    nameEn: 'Ship / Project Management & Planning',
  },
  {
    id: 'Symbiotic Relations',
    nameTh: 'Symbiotic Relations (ลูกค้าสัมพันธ์และพันธมิตร)',
    nameEn: 'Symbiotic Relations',
  },
  {
    id: 'Coating & Staging',
    nameTh: 'Coating & Staging (งานพ่นสีและนั่งร้าน)',
    nameEn: 'Coating & Staging',
  },
  {
    id: 'Hull & Piping',
    nameTh: 'Hull & Piping (งานตัวเรือและระบบท่อ)',
    nameEn: 'Hull & Piping',
  },
  {
    id: 'Mechanical & Electrical',
    nameTh: 'Mechanical & Electrical (งานเครื่องกลและระบบไฟฟ้า)',
    nameEn: 'Mechanical & Electrical',
  },
  {
    id: 'Shipwright',
    nameTh: 'Shipwright (งานช่างต่อเรือและด็อคกิ้ง)',
    nameEn: 'Shipwright',
  },
  {
    id: '__OTHER__',
    nameTh: 'ระบุแผนกอื่นๆ (Other Department)...',
    nameEn: 'Other Department (Specify)...',
  },
];

export function findMatchingDepartment(deptStr: string | null | undefined): DepartmentOption | undefined {
  if (!deptStr) return undefined;
  const clean = deptStr.trim();
  const lower = clean.toLowerCase();

  // 1. Exact match by id or names
  const exact = UNITHAI_DEPARTMENTS.find(
    (d) => d.id === clean || d.nameTh === clean || d.nameEn === clean
  );
  if (exact && exact.id !== '__OTHER__') return exact;

  // 2. Case-insensitive exact match
  const caseMatch = UNITHAI_DEPARTMENTS.find(
    (d) => d.id.toLowerCase() === lower || d.nameEn.toLowerCase() === lower
  );
  if (caseMatch && caseMatch.id !== '__OTHER__') return caseMatch;

  // 3. Keyword / partial matching
  if (lower.includes('warehouse') || lower.includes('logistics')) {
    return UNITHAI_DEPARTMENTS.find((d) => d.id === 'Warehouse, Logistics');
  }
  if (lower.includes('people') || lower.includes('organization value')) {
    return UNITHAI_DEPARTMENTS.find((d) => d.id === 'People and Organization Value Management');
  }
  if (lower.includes('administration') || lower.includes('admin')) {
    return UNITHAI_DEPARTMENTS.find((d) => d.id === 'Administration');
  }
  if (lower.includes('asset') && lower.includes('value')) {
    return UNITHAI_DEPARTMENTS.find((d) => d.id === 'Asset Value-Added Management');
  }
  if (lower.includes('management information') || lower === 'mis') {
    return UNITHAI_DEPARTMENTS.find((d) => d.id === 'Management Information System');
  }
  if (lower.includes('purchasing')) {
    return UNITHAI_DEPARTMENTS.find((d) => d.id === 'Purchasing');
  }
  if (lower.includes('subcontract')) {
    return UNITHAI_DEPARTMENTS.find((d) => d.id === 'Subcontracting');
  }
  if (lower.includes('health') || lower.includes('safety') || lower.includes('hsse') || lower.includes('security')) {
    return UNITHAI_DEPARTMENTS.find((d) => d.id === 'Health, Safety, Security and Environment');
  }
  if (lower.includes('qa/qc') || lower.includes('lss') || lower.includes('qa') || lower.includes('qc')) {
    return UNITHAI_DEPARTMENTS.find((d) => d.id === 'QA/QC & LSS');
  }
  if (lower.includes('yard facilities') || lower.includes('yard development')) {
    return UNITHAI_DEPARTMENTS.find((d) => d.id === 'Yard Facilities and Yard Development');
  }
  if (lower.includes('sustainability') || lower.includes('innovation')) {
    return UNITHAI_DEPARTMENTS.find((d) => d.id === 'Quality, Sustainability and Innovation');
  }
  if (lower.includes('project management') || lower.includes('ship repair management') || lower.includes('srm') || lower.includes('planning')) {
    return UNITHAI_DEPARTMENTS.find((d) => d.id === 'Ship / Project Management & Planning');
  }
  if (lower.includes('symbiotic')) {
    return UNITHAI_DEPARTMENTS.find((d) => d.id === 'Symbiotic Relations');
  }
  if (lower.includes('coating') || lower.includes('staging') || lower.includes('blasting') || lower.includes('painting')) {
    return UNITHAI_DEPARTMENTS.find((d) => d.id === 'Coating & Staging');
  }
  if (lower.includes('hull') || lower.includes('piping') || lower.includes('pipe')) {
    return UNITHAI_DEPARTMENTS.find((d) => d.id === 'Hull & Piping');
  }
  if (lower.includes('mechanical') || lower.includes('electrical') || lower.includes('machinery')) {
    return UNITHAI_DEPARTMENTS.find((d) => d.id === 'Mechanical & Electrical');
  }
  if (lower.includes('shipwright') || lower.includes('docking') || lower.includes('dock operations')) {
    return UNITHAI_DEPARTMENTS.find((d) => d.id === 'Shipwright');
  }

  return undefined;
}
