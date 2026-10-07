// client/src/utils/orderParser.ts
// Upgraded Ultra-Robust PDF & Excel Order Extraction Engine for Tersan, Dearsan, Azurine, Cemre, Marini, Aselsan POs

export interface ExtractedOrderItem {
  id?: string;
  productCode: string;
  productName?: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  total?: number;
  isUretimDisi?: boolean;
}

export interface CleanCodeDescResult {
  code: string;
  desc: string;
  detectedProjectNo?: string;
}

export interface ExtractedQtyUnit {
  qty: number;
  unit: string;
  matchIndex: number;
  matchLength: number;
  isExplicitMeterOrCount: boolean;
}

/**
 * Checks if a string is an IBAN or bank account format
 */
export function isIbanString(str: string): boolean {
  if (!str) return false;
  const cleaned = str.replace(/\s+/g, '').toUpperCase();
  return /^TR\d{22,26}$/.test(cleaned) || /TR\d{2}[0-9A-Z]{20,28}/.test(cleaned);
}

/**
 * Removes IBAN and bank account numbers from text
 */
export function removeIban(text: string): string {
  if (!text) return '';
  return text
    .replace(/TR\d{2}\s*(\d{4}\s*){4,5}\d{1,4}/gi, '')
    .replace(/TR\d{22,26}/gi, '')
    .replace(/IBAN\s*[:\-\s]*[A-Z0-9\s]{15,34}/gi, '')
    .trim();
}

/**
 * Comprehensive check for footer, summary, bank, payment, total, tax, and order metadata lines.
 */
export function isFooterOrSummaryLine(str: string): boolean {
  if (!str) return false;
  const normStr = str
    .toUpperCase()
    .replace(/İ/g, 'I')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .trim();

  // Sentence / Disclaimer / Note phrases
  const isDisclaimerSentence = 
    normStr.includes('ELEKTROPOLISAJ') ||
    normStr.includes('BAKTIGI') ||
    normStr.includes('VERIYORUZ') ||
    normStr.includes('BIRAKIYORUZ') ||
    normStr.includes('ALTERNATIFLI') ||
    normStr.includes('SANAYINDE') ||
    normStr.includes('KURUMSAL') ||
    normStr.includes('TERCIH') ||
    normStr.includes('HALDEDIR') ||
    normStr.includes('GECERLIDIR') ||
    normStr.includes('HARICTIR') ||
    normStr.includes('DAHILDIR') ||
    normStr.includes('TEKLIFIMIZ') ||
    (normStr.length > 35 && (normStr.includes('MUSTERI') || normStr.includes('FIYAT') || normStr.includes('URUN')));

  return (
    isDisclaimerSentence ||
    normStr.includes('ODEME') ||
    normStr.includes('BANKA') ||
    normStr.includes('ZIRAAT') ||
    normStr.includes('IS BANKASI') ||
    normStr.includes('GARANTI') ||
    normStr.includes('YAPI KREDI') ||
    normStr.includes('AKBANK') ||
    normStr.includes('VAKIF') ||
    normStr.includes('HALK') ||
    normStr.includes('HAVALE') ||
    normStr.includes('EFT') ||
    normStr.includes('IBAN') ||
    /\bTR\d{2}\b/.test(normStr) ||
    normStr.includes('NET TUTAR') ||
    normStr.includes('BRUT TUTAR') ||
    normStr.includes('GENEL TOPLAM') ||
    normStr.includes('GRAND TOTAL') ||
    normStr.includes('SUBTOTAL') ||
    normStr.includes('TOPLAM TUTAR') ||
    normStr.includes('TOPLAM TL') ||
    normStr.includes('TOPLAM ₺') ||
    normStr.includes('TOPLAM:') ||
    normStr.includes('TOPLAM') ||
    normStr.includes('ISKONTO') ||
    normStr.includes('DISCOUNT') ||
    normStr.includes('KDV') ||
    normStr.includes('V.D') ||
    normStr.includes('V.NO') ||
    normStr.includes('VERGI') ||
    normStr.includes('VKN') ||
    normStr.includes('TCKN') ||
    normStr.includes('CADDE') ||
    normStr.includes('CAD.') ||
    normStr.includes('SOKAK') ||
    normStr.includes('SOK.') ||
    normStr.includes('MAHALLE') ||
    normStr.includes('MAH.') ||
    normStr.includes('BULVAR') ||
    normStr.includes('MEVKI') ||
    normStr.includes('NO:4') ||
    normStr.includes('NO:') ||
    normStr.includes('NO :') ||
    normStr.includes('KONACIK') ||
    normStr.includes('BODRUM') ||
    normStr.includes('TEL:') ||
    normStr.includes('MOBIL') ||
    normStr.includes('E MAIL') ||
    normStr.includes('EMAIL') ||
    normStr.includes('WWW.') ||
    normStr.includes('ODENECEK TUTAR') ||
    normStr.includes('YUKARIDA BELIRTILEN') ||
    normStr.includes('TESLIM EDEN') ||
    normStr.includes('TESLIM ALAN') ||
    normStr.includes('FATURANIZIN') ||
    normStr.includes('ISTISNAYA TABI') ||
    normStr.includes('TESLIM SURESI') ||
    normStr.includes('TESLIMAT') ||
    normStr.includes('SEVK ADRESI') ||
    normStr.includes('SEVK TURI') ||
    normStr.includes('AMBAR') ||
    normStr.includes('NOT:') ||
    normStr.includes('YAZIYLA') ||
    normStr.includes('BIRLESTIRME PARCASI ODEME') ||
    normStr.includes('KIMDEN') ||
    normStr.includes('KIME') ||
    normStr.includes('ALICI') ||
    normStr.includes('SATICI') ||
    normStr.includes('SIPARIS FORMU') ||
    normStr.includes('TEKLIF FORMU')
  );
}

/**
 * Extract Customer Name from Filename if present
 */
export function extractCustomerFromFilename(filename: string): string {
  if (!filename) return '';
  const cleanName = filename.replace(/\.(xlsx|xls|pdf|png|jpg|jpeg)$/i, '').trim();
  const parts = cleanName.split(/[\-_]/);
  for (const part of parts) {
    const trimmed = part.trim().toUpperCase();
    if (
      trimmed.length >= 3 && 
      !trimmed.includes('REVİZE') && !trimmed.includes('REVIZE') && 
      !trimmed.includes('SİPARİŞ') && !trimmed.includes('SIPARIS') && 
      !trimmed.includes('PASLANMAZ') && !trimmed.includes('GALVANİZ') && !trimmed.includes('GALVANIZ') &&
      !trimmed.includes('FORMU') && !trimmed.includes('TEKLİF') && !trimmed.includes('TEKLIF') &&
      !/\d{2}\.\d{2}\.\d{4}/.test(trimmed)
    ) {
      if (trimmed.includes('NEVA')) return 'NEVA ROBOTİCS SAN. VE TİC. A.Ş.';
      if (trimmed.includes('AKSİYON') || trimmed.includes('AKSIYON')) return 'AKSİYON ROBOTİK SAN. TİC. A.Ş.';
      if (trimmed.includes('DEARSAN')) return 'DEARSAN GEMİ İNŞAAT SANAYİ A.Ş.';
      if (trimmed.includes('TERSAN')) return 'TERSAN TERSANECİLİK SAN. VE TİC. A.Ş.';
      if (trimmed.includes('MARINI') || trimmed.includes('MARİNİ')) return 'MARİNİ MAKİNA A.Ş.';
      if (trimmed.includes('ASELSAN')) return 'ASELSAN ELEKTRONİK SANAYİ A.Ş.';
      if (trimmed.includes('CEMRE')) return 'CEMRE TERSANECİLİK SAN. VE TİC. A.Ş.';
      if (trimmed.includes('U4')) return 'U4 MARİNE SAN. VE TİC. A.Ş.';
      if (trimmed.length > 3 && !/^\d+$/.test(trimmed)) return trimmed;
    }
  }
  return '';
}

/**
 * Slices off trailing footer / payment / bank text merged onto an item description.
 */
export function cleanFooterFromDesc(desc: string): string {
  if (!desc) return '';
  const footerCutoffRegex = /(?:\s+|^)(?:ODEME|ÖDEME|BANKA|ZIRAAT|ZİRAAT|IS BANKASI|İŞ BANKASI|GARANTI|GARANTİ|YAPI KREDI|YAPI KREDİ|AKBANK|VAKIF|HALK|HAVALE|EFT|IBAN|NET TUTAR|BRUT TUTAR|GENEL TOPLAM|GRAND TOTAL|SUBTOTAL|TOPLAM TUTAR|TOPLAM ₺|TOPLAM TL|TOPLAM:|TOPLAM|KDV|YAZIYLA|TESLIM EDEN|TESLIM ALAN|FATURA ADRESI|FATURANIZIN|TESLIM SURESI|TESLİM SÜRESİ|SEVK ADRESI|AMBAR|NOT:).*/i;
  return desc.replace(footerCutoffRegex, '').trim();
}

/**
 * Standardize unit strings
 */
export function normalizeUnit(rawUnit: string): string {
  if (!rawUnit) return 'ADET';
  const u = rawUnit.trim().toUpperCase();
  if (/^M$|^MT$|METRE|MTR|METRİK/i.test(u)) return 'METRE';
  if (/^AD$|^ADI$|ADET|PCS|PIECE|PIECES/i.test(u)) return 'ADET';
  if (/BOY|LENGTH/i.test(u)) return 'BOY';
  if (/KG|KILO|KİLOGRAM/i.test(u)) return 'KG';
  if (/SET|TAKIM|TK/i.test(u)) return 'SET';
  return u;
}

/**
 * Multi-Unit Quantity Extractor: scans string for all (number, unit) pairs,
 * prioritizing explicit physical measures (METRE/MT/KG) over BOY count,
 * resolving Cable Tray quantity issues (e.g. 14.4 MT instead of 6 BOY).
 */
export function extractBestQtyAndUnit(line: string): ExtractedQtyUnit | null {
  if (!line) return null;

  const allMatches: ExtractedQtyUnit[] = [];
  const regex = /(\b\d+(?:[\.,]\d+)?)\s*(ADET|ADI|AD|PCS|PIECE|PIECES|MT|METRE|MTR|M|BOY|KG|KILO|KILOGRAM|SET|TAKIM|TK|PK|CIFT|TN|RULO|M2|M3)\b/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(line)) !== null) {
    const rawNum = match[1].replace(',', '.');
    const num = Number(rawNum);
    if (isNaN(num) || num <= 0) continue;

    const rawUnit = match[2].toUpperCase();
    const normalized = normalizeUnit(rawUnit);

    let priority = 3; // BOY or default count
    if (['METRE', 'MT', 'M', 'KG', 'M2', 'M3'].includes(normalized) || ['MT', 'METRE', 'MTR', 'M', 'KG', 'KILO'].includes(rawUnit)) {
      priority = 1; // Physical measurement (Meters / Kilograms)
    } else if (['ADET', 'PCS', 'SET'].includes(normalized) || ['ADET', 'AD', 'ADI', 'PCS', 'SET', 'TAKIM', 'TK'].includes(rawUnit)) {
      priority = 2; // Count units
    }

    allMatches.push({
      qty: num,
      unit: normalized,
      matchIndex: match.index,
      matchLength: match[0].length,
      isExplicitMeterOrCount: priority < 3
    });
  }

  if (allMatches.length === 0) return null;

  // Sort matches by priority (Priority 1 > Priority 2 > Priority 3), then by match index
  allMatches.sort((a, b) => {
    const getP = (u: string) => (u === 'METRE' || u === 'KG' ? 1 : (u === 'BOY' ? 3 : 2));
    const pA = getP(a.unit);
    const pB = getP(b.unit);
    if (pA !== pB) return pA - pB;
    return a.matchIndex - b.matchIndex;
  });

  return allMatches[0];
}

/**
 * Cleans prefix strings or combined text tokens from PDF/Excel rows.
 */
export function cleanCodeAndDesc(rawCodeOrPrefix: string, rawDesc: string = ''): CleanCodeDescResult {
  const descWordRegex = /^(ALÜM|ALUM|ALÜMİNYUM|ALUMINYUM|GEMİ|GEMI|TİPİ|TIPI|KABLO|KANALI|KANAL|BOYALI|BOYASIZ|SICAK|DALDIRMA|GALVANİZ|GALVANIZ|PREGALVANİZ|PREGALVANIZ|PASLANMAZ|ÇELİK|CELIK|SAC|KAPLAMALI|BÜKÜM|BUKUM|KAPAK|KÖŞE|KOSE|DÜZ|DUZ|MERDİVEN|MERDIVEN|KONSOL|TAVAN|ASKI|CİVATA|CIVATA|SOMUN|PUL|DÜBEL|DUBEL|TIJ|TİJ|ELEGANT|HEAVY|MEDIUM|LIGHT|TYPE|CABLE|TRAY|GALVANIZED|PAINTED|STAINLESS|STEEL|ALUMINUM|HOPARLÖR|AYAĞI|AYAGI|DIRSEK|DİRSEK|REDUKSIYON|REDÜKSİYON|EK|PARÇASI|PARCASI|SİPARİŞ|SIPARIS|KALEM|KALEMİ)$/i;

  let cleanCodeVal = removeIban(rawCodeOrPrefix || '').trim().replace(/\s+/g, ' ');
  let cleanDescVal = removeIban(rawDesc || '').trim().replace(/\s+/g, ' ');

  cleanCodeVal = cleanCodeVal.replace(/^\d{1,3}[\.\-]?\s+/, '');

  let detectedProjectNo = '';

  const prjMatch = cleanDescVal.match(/(NB\d{3,5}[A-Z]?)/i) || cleanCodeVal.match(/(NB\d{3,5}[A-Z]?)/i);
  if (prjMatch) {
    detectedProjectNo = prjMatch[1].toUpperCase();
  }

  cleanDescVal = cleanFooterFromDesc(cleanDescVal);

  // If cleanDescVal is a sequence digit (e.g. "1", "2", "3"), reset it to cleanCodeVal
  if (/^\d{1,3}\.?$/.test(cleanDescVal)) {
    cleanDescVal = cleanCodeVal;
  }

  // Swap code and desc if code looks like dimensions (e.g. 200X40X1.2MM) and desc looks like product code (e.g. S20-1K)
  const isDimensionPattern = /^\d+(?:[\.,]\d+)?\s*X\s*\d+/i.test(cleanCodeVal);
  const isProductCodePattern = /^[A-Z]{1,5}\d{1,6}(?:-[0-9A-Z]{1,8})?$/i.test(cleanDescVal) || /^[A-Z0-9]{2,8}-[0-9A-Z]{2,8}$/i.test(cleanDescVal);

  if (isDimensionPattern && isProductCodePattern) {
    const temp = cleanCodeVal;
    cleanCodeVal = cleanDescVal;
    cleanDescVal = temp;
  }

  if (
    cleanCodeVal && 
    cleanDescVal && 
    cleanCodeVal !== cleanDescVal && 
    !descWordRegex.test(cleanCodeVal) && 
    cleanCodeVal.length <= 35 && 
    !isIbanString(cleanCodeVal) &&
    !isFooterOrSummaryLine(cleanCodeVal)
  ) {
    return {
      code: cleanCodeVal.toUpperCase(),
      desc: cleanDescVal.toUpperCase(),
      detectedProjectNo
    };
  }

  let combined = `${cleanCodeVal} ${cleanDescVal}`.trim();
  combined = cleanFooterFromDesc(combined);
  if (!combined) {
    return { code: 'MALZ-KOD', desc: '', detectedProjectNo: '' };
  }

  const tokens = combined.split(' ').filter(t => t.length > 0);
  const tokensClean = [...tokens];

  if (tokensClean.length > 1 && /^\d{1,3}\.?$/.test(tokensClean[0])) {
    tokensClean.shift();
  }

  if (tokensClean.length === 0) {
    return { code: 'MALZ-KOD', desc: combined, detectedProjectNo: '' };
  }

  let code = '';
  let codeTokensCount = 0;

  for (let i = 0; i < tokensClean.length; i++) {
    const t = tokensClean[i].toUpperCase();
    if (
      !descWordRegex.test(t) &&
      !isIbanString(t) &&
      !isFooterOrSummaryLine(t) &&
      !t.startsWith('TR9') &&
      /^[A-Z0-9]{2,8}[\-\/\.][A-Z0-9]{2,10}(?:[\-\/][A-Z0-9]{2,8})?$/i.test(t)
    ) {
      code = t;
      codeTokensCount = i + 1;
      break;
    }
  }

  if (!code && tokensClean.length >= 2) {
    const firstUpper = tokensClean[0].toUpperCase();
    const secondUpper = tokensClean[1].toUpperCase();
    const isShortPrefix = /^[A-Z0-9]{1,5}$/.test(firstUpper) && !descWordRegex.test(firstUpper) && !isFooterOrSummaryLine(firstUpper);
    const isCodeBody = /^[0-9A-Z\/\-]{1,15}$/.test(secondUpper) && !/^(AD|PCS|MT|KG|SET|TAKIM|TK|BOY|ADET)$/.test(secondUpper);
    if (isShortPrefix && isCodeBody) {
      code = `${tokensClean[0]} ${tokensClean[1]}`;
      codeTokensCount = 2;
    }
  }

  if (!code && tokensClean.length >= 1) {
    const t0 = tokensClean[0].toUpperCase();
    if (
      !descWordRegex.test(t0) && 
      !isIbanString(t0) && 
      !isFooterOrSummaryLine(t0) &&
      !t0.startsWith('TR9') && 
      /^[A-Z0-9\-\/]{3,20}$/.test(t0) && 
      !/^(ADET|PCS|METRE|MT|KG|BOY|SET)$/.test(t0)
    ) {
      code = t0;
      codeTokensCount = 1;
    }
  }

  if (!code) {
    if (cleanCodeVal && cleanCodeVal !== cleanDescVal && !descWordRegex.test(cleanCodeVal) && !isIbanString(cleanCodeVal) && !isFooterOrSummaryLine(cleanCodeVal)) {
      code = cleanCodeVal;
    } else {
      code = tokensClean.slice(0, 2).join('-').toUpperCase().replace(/[^A-Z0-9\-]/g, '');
      if (!code) code = 'MALZ-KOD';
    }
    codeTokensCount = 0;
  }

  // Check if subsequent tokens (e.g. "T-P", "-P", "P", "1K", "+", "M8F") belong to product code before reaching a description word
  if (code && codeTokensCount > 0 && codeTokensCount < tokensClean.length) {
    while (codeTokensCount < tokensClean.length) {
      const nextToken = tokensClean[codeTokensCount].toUpperCase();
      const isDescWord = descWordRegex.test(nextToken);
      const isUnitWord = /^(ADET|PCS|AD|MT|M|METRE|MTR|KG|KILO|SET|TAKIM|TK|BOY|PK)$/i.test(nextToken);
      const isDimension = /^\d+(?:[\.,]\d+)?\s*X\s*\d+/i.test(nextToken) || /^\d+MM$/i.test(nextToken);
      const isFooterOrIban = isIbanString(nextToken) || isFooterOrSummaryLine(nextToken);
      const isShortSuffix = /^[A-Z0-9\+\-\/\.\*]{1,8}$/i.test(nextToken);

      if (!isDescWord && !isUnitWord && !isDimension && !isFooterOrIban && isShortSuffix) {
        code += ` ${tokensClean[codeTokensCount]}`;
        codeTokensCount++;
      } else {
        break;
      }
    }
  }

  const descTokens = codeTokensCount > 0 ? tokensClean.slice(codeTokensCount) : tokensClean;
  const finalDescTokens: string[] = [];

  for (const token of descTokens) {
    const tUpper = token.toUpperCase();
    const isSfi = /^\d{6}$/.test(tUpper) || /^\d{3}\.\d{3}$/.test(tUpper);
    const isProje = /^(NB|PRJ|PROJE)[\-\s]?\d{3,5}[A-Z]?$/i.test(tUpper) || /^NB\d{4}[A-Z]?$/i.test(tUpper);

    if (isProje && !detectedProjectNo) {
      const match = tUpper.match(/(NB\d{3,5}[A-Z]?)/i);
      if (match) detectedProjectNo = match[1];
      else detectedProjectNo = tUpper;
    }

    if (!isSfi && !isProje && !isIbanString(tUpper) && !isFooterOrSummaryLine(tUpper)) {
      finalDescTokens.push(token);
    }
  }

  let desc = cleanFooterFromDesc(finalDescTokens.join(' ').trim());
  if (!desc) {
    desc = combined;
  }

  return {
    code: code.toUpperCase(),
    desc: desc.toUpperCase(),
    detectedProjectNo
  };
}

/**
 * Parse lines extracted from PDF to items list.
 * Fixes quantity miscalculations and footer bleeding.
 */
export function parsePdfTextToItems(text: string): { items: ExtractedOrderItem[]; detectedProjectNo?: string } {
  const extractedItems: ExtractedOrderItem[] = [];
  let detectedProjectNo = '';
  let tableEnded = false;

  const linesList = text.split('\n');

  linesList.forEach((line, idx) => {
    const cleanedLine = line.trim();
    if (!cleanedLine) return;

    if (isIbanString(cleanedLine) || /TR\d{2}\s*(\d{4}\s*){4,5}\d{1,4}/i.test(cleanedLine)) {
      return;
    }

    const cleanUpper = cleanedLine.toUpperCase();
    const normLine = cleanUpper
      .replace(/İ/g, 'I').replace(/Ğ/g, 'G').replace(/Ü/g, 'U')
      .replace(/Ş/g, 'S').replace(/Ö/g, 'O').replace(/Ç/g, 'C');

    // Footer / Summary Detection: If items have already been extracted AND line is a footer line
    if (extractedItems.length > 0 && isFooterOrSummaryLine(cleanedLine)) {
      tableEnded = true;
      return;
    }

    if (tableEnded) return;

    // Skip top header metadata lines
    const isHeaderMetadata = 
      normLine.includes('ODEME BILGI') || normLine.includes('ODEME KOSUL') || normLine.includes('BANKA BILGI') ||
      normLine.includes('VERGI DAIRES') || normLine.includes('TEL:') || normLine.includes('FAX:') ||
      normLine.includes('E-MAIL:') || normLine.includes('SAYFA 1') || normLine.includes('SATINALMA SIPARISI') ||
      normLine.includes('ORDER NO') || normLine.includes('SIPARIS TARIHI') || normLine.includes('IBAN:');

    if (isHeaderMetadata && extractedItems.length === 0) {
      return;
    }

    // Flexible Quantity + Unit Extractor: resolves Cable Tray 14.4 M vs 6 BOY
    const qtyUnitMatch = extractBestQtyAndUnit(cleanedLine);

    if (qtyUnitMatch) {
      const matchIndex = qtyUnitMatch.matchIndex;
      const qty = qtyUnitMatch.qty;
      const unit = qtyUnitMatch.unit;

      const prefixStr = removeIban(cleanedLine.substring(0, matchIndex)).trim();
      const suffixStr = cleanedLine.substring(matchIndex + qtyUnitMatch.matchLength).trim();

      const numbersInSuffix = suffixStr.match(/\d+(?:[\.,]\d+)?/g) || [];
      let price = 0;
      let total = 0;
      if (numbersInSuffix.length >= 2) {
        price = Number((numbersInSuffix[0] || '0').replace(',', '.'));
        total = Number((numbersInSuffix[numbersInSuffix.length - 1] || '0').replace(',', '.'));
      } else if (numbersInSuffix.length === 1) {
        price = Number((numbersInSuffix[0] || '0').replace(',', '.'));
        total = qty * price;
      }

      if (prefixStr.length > 0) {
        let { code, desc, detectedProjectNo: prj } = cleanCodeAndDesc(prefixStr, '');
        desc = cleanFooterFromDesc(desc);
        if (prj && !detectedProjectNo) detectedProjectNo = prj;

        if (code && code !== 'MALZ-KOD' && qty > 0 && !isIbanString(code) && !code.startsWith('TR9') && !isFooterOrSummaryLine(code)) {
          extractedItems.push({
            id: `item-pdf-${idx}-${Date.now()}`,
            productCode: code,
            productName: desc,
            description: desc,
            quantity: qty,
            unit: unit,
            price: price,
            total: total || (qty * price),
            isUretimDisi: code.toLowerCase().includes('civata') || code.toLowerCase().includes('somun') || code.toLowerCase().includes('tij')
          });
          return;
        }
      }
    }

    // Multi-column table number fallback (e.g. Qty, UnitPrice, IndPrice, Total: "10,00 18.0000 18.0000 180,00")
    const tableMultiNumMatch = cleanedLine.match(/(.+?)\s+(\d+(?:[\.,]\d+)?)\s+(\d+(?:[\.,]\d+)?)(?:\s+(\d+(?:[\.,]\d+)?))?\s+(\d+(?:[\.,]\d+)?)\s*$/);
    if (tableMultiNumMatch && !tableEnded) {
      const prefixStr = removeIban(tableMultiNumMatch[1]).trim();
      const qty = Number(tableMultiNumMatch[2].replace(',', '.'));
      const price = Number(tableMultiNumMatch[3].replace(',', '.'));
      const total = Number(tableMultiNumMatch[5].replace(',', '.'));
      const isHeader = cleanUpper.includes('TARIH') || cleanUpper.includes('NO:') || cleanUpper.includes('MÜŞTERİ') || cleanUpper.includes('SAYFA') || cleanUpper.includes('MALZEME TANIMI');

      if (prefixStr && qty > 0 && !isHeader && !isFooterOrSummaryLine(prefixStr)) {
        let { code, desc, detectedProjectNo: prj } = cleanCodeAndDesc(prefixStr, '');
        desc = cleanFooterFromDesc(desc);
        if (prj && !detectedProjectNo) detectedProjectNo = prj;

        if (code && code !== 'MALZ-KOD' && !isIbanString(code) && !code.startsWith('TR9') && !isFooterOrSummaryLine(code)) {
          extractedItems.push({
            id: `item-pdf-${idx}-${Date.now()}`,
            productCode: code,
            productName: desc,
            description: desc,
            quantity: qty,
            unit: 'ADET',
            price: price,
            total: total || (qty * price),
            isUretimDisi: code.toLowerCase().includes('civata') || code.toLowerCase().includes('somun') || code.toLowerCase().includes('tij')
          });
          return;
        }
      }
    }

    // Fallback line parsing for items where Qty appears at the end without explicit unit
    const qtyOnlyMatch = cleanedLine.match(/(.+?)\s+(\d+(?:[\.,]\d+)?)\s*$/);
    if (qtyOnlyMatch && !tableEnded) {
      const prefixStr = removeIban(qtyOnlyMatch[1]).trim();
      const qty = Number(qtyOnlyMatch[2].replace(',', '.'));
      const isHeader = cleanUpper.includes('TARIH') || cleanUpper.includes('NO:') || cleanUpper.includes('MÜŞTERİ') || cleanUpper.includes('SAYFA') || cleanUpper.includes('MALZEME TANIMI');

      if (prefixStr && qty > 0 && !isHeader && !isFooterOrSummaryLine(prefixStr)) {
        let { code, desc, detectedProjectNo: prj } = cleanCodeAndDesc(prefixStr, '');
        desc = cleanFooterFromDesc(desc);
        if (prj && !detectedProjectNo) detectedProjectNo = prj;

        if (code && code !== 'MALZ-KOD' && desc && desc !== code && !isIbanString(code) && !code.startsWith('TR9') && !isFooterOrSummaryLine(code)) {
          extractedItems.push({
            id: `item-pdf-${idx}-${Date.now()}`,
            productCode: code,
            productName: desc,
            description: desc,
            quantity: qty,
            unit: 'ADET',
            price: 0,
            total: 0,
            isUretimDisi: code.toLowerCase().includes('civata') || code.toLowerCase().includes('somun') || code.toLowerCase().includes('tij')
          });
          return;
        }
      }
    }

    // Continuation line logic (dimensions like "200x50x1.5mm")
    if (extractedItems.length > 0 && !tableEnded) {
      if (isFooterOrSummaryLine(cleanedLine)) {
        tableEnded = true;
        return;
      }

      const lastItem = extractedItems[extractedItems.length - 1];
      if (lastItem) {
        const isHeader = cleanUpper.includes('TARIH') || cleanUpper.includes('NO:') || cleanUpper.includes('MÜŞTERİ') || cleanUpper.includes('SAYFA') || cleanUpper.includes('TEKLIF') || cleanUpper.includes('MALZEME TANIMI') || cleanUpper.includes('SİPARİŞ NO');
        if (!isHeader && cleanUpper.length >= 1 && !isIbanString(cleanedLine)) {
          const lineTokens = cleanedLine.split(/\s+/).filter(t => {
            const isSfi = /^\d{6}$/.test(t) || /^\d{3}\.\d{3}$/.test(t);
            const isProje = /^NB\d+[A-Z]?$/i.test(t) || /^PRJ-/i.test(t);
            if (isProje && !detectedProjectNo) {
              detectedProjectNo = t.toUpperCase();
            }
            return !isSfi && !isProje && !isIbanString(t);
          });
          const cleanLineFiltered = lineTokens.join(' ').trim();
          if (cleanLineFiltered.length > 0 && !/^\d+$/.test(cleanLineFiltered)) {
            const appendedDesc = cleanFooterFromDesc(`${lastItem.description} ${cleanLineFiltered}`.trim().toUpperCase());
            lastItem.description = appendedDesc;
            lastItem.productName = appendedDesc;
          }
        }
      }
    }
  });

  return { items: extractedItems, detectedProjectNo };
}
