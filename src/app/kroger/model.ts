export interface API_KrogerSearch {
  filterTerm: string;
}

export interface API_KrogerAddCart {
  items: KrogerAddCartItem[];
}

export interface API_KrogerAddCartResponse {
  result: boolean;
}

export interface KrogerAddCartItem {
  upc: string;
  quantity: number;
}

export interface AuthParams {
  code: string;
}

export interface AisleLocation {
  bayNumber: string;
  description: string;
  number: string;
  numberOfFacings: string;
  sequenceNumber: string;
  side: string;
  shelfNumber: string;
  shelfPositionInBay: string;
}

export interface ItemInformation {
  depth: string;
  height: string;
  width: string;
}

export interface Temperature {
  indicator: string;
  heatSensitive: string;
}
export interface Size {
  size: string;
  url: string;
}

export interface Image {
  perspective: string;
  sizes: Size[];
  featured?: boolean;
}

export interface KrogerProduct {
  productId: string;
  upc: string;
  aisleLocations: any[];
  brand: string;
  categories: string[];
  description: string;
  images: Image[];
  items: Item[];
  itemInformation: ItemInformation;
  temperature: Temperature;
}
export interface Fulfillment {
  curbside: boolean;
  delivery: boolean;
  inStore: boolean;
  shipToHome: boolean;
}
export interface Price {
  regular: number;
  promo: number;
}

export interface Item {
  itemId: string;
  favorite: boolean;
  fulfillment: Fulfillment;
  price?: Price;
  size: string;
  soldBy: string;
}
export interface Pagination {
  total: string;
  start: string;
  limit: string;
}

export interface Meta {
  pagination: Pagination;
  warnings: string[];
}

export interface API_KrogerProdRes {
  data: KrogerProduct[];
  meta: Meta;
}

export interface KrogerAuthStatus {
  isAuthorized: boolean;
}

export interface KrogerAuthResponse {
  expires_in: number;
  access_token: string;
  token_type: string;
  refresh_token: string;
}
