interface IPlusCode {
  plus_code: PlusCode
  results: Result[]
  status: string
}

export interface PlusCode {
  compound_code: string
  global_code: string
}

export interface Result {
  address_components: AddressComponent[]
  formatted_address: string
  geometry: Geometry
  place_id: string
  plus_code?: PlusCode
  types: string[]
}

export interface AddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

export interface Geometry {
  location: Location
  location_type: LocationType
  viewport: Bounds
  bounds?: Bounds
}

export interface Bounds {
  northeast: Location
  southwest: Location
}

export interface Location {
  lat: number
  lng: number
}

export enum LocationType {
  Approximate = 'APPROXIMATE',
  GeometricCenter = 'GEOMETRIC_CENTER',
  Rooftop = 'ROOFTOP',
}

export default IPlusCode
