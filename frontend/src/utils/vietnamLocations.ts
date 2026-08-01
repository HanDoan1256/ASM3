import { getDistrictsByProvinceCode, getProvinces, getWardsByDistrictCode } from "sub-vn";

export interface LocationOption {
  label: string;
  value: string;
}

export function listVietnamProvinces(): LocationOption[] {
  return getProvinces().map((province: { code: string; name: string }) => ({
    label: province.name,
    value: province.code,
  }));
}

export function listVietnamDistricts(provinceCode: string): LocationOption[] {
  if (!provinceCode) {
    return [];
  }

  return getDistrictsByProvinceCode(provinceCode).map((district: { code: string; name: string }) => ({
    label: district.name,
    value: district.code,
  }));
}

export function listVietnamWards(districtCode: string): LocationOption[] {
  if (!districtCode) {
    return [];
  }

  return getWardsByDistrictCode(districtCode).map((ward: { name: string }) => ({
    label: ward.name,
    value: ward.name,
  }));
}

export function appendWardToStreet(street: string, ward: string): string {
  const trimmedStreet = street.trim();
  const trimmedWard = ward.trim();
  if (!trimmedWard) {
    return trimmedStreet;
  }
  return `${trimmedStreet}, Ward ${trimmedWard}`;
}

export function splitStreetAndWard(street: string): { streetLine: string; ward: string } {
  const match = street.match(/^(.*?),\s*Ward\s+(.+)$/i);
  if (!match) {
    return { streetLine: street, ward: "" };
  }

  return {
    streetLine: match[1].trim(),
    ward: match[2].trim(),
  };
}
