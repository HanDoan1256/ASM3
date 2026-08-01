declare module "sub-vn" {
  export function getProvinces(): Array<{ code: string; name: string }>;
  export function getDistrictsByProvinceCode(provinceCode: string): Array<{ code: string; name: string }>;
  export function getWardsByDistrictCode(districtCode: string): Array<{ name: string }>;
}
