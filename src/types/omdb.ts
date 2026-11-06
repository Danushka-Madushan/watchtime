export interface OmdbSearchResultItem {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OmdbRawSearchResponse {
  Search?: OmdbSearchResultItem[];
  totalResults?: string;
  Response: 'True' | 'False';
  Error?: string;
}

export interface OmdbSearchResponse {
  items: OmdbSearchResultItem[];
  total: number;
}

export interface OmdbRating {
  Source: string;
  Value: string;
}

export interface OmdbDetailResponse {
  Title: string;
  Year: string;
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Genre?: string;
  Director?: string;
  Writer?: string;
  Actors?: string;
  Plot?: string;
  Language?: string;
  Country?: string;
  Awards?: string;
  Poster: string;
  Ratings?: OmdbRating[];
  Metascore?: string;
  imdbRating?: string;
  imdbVotes?: string;
  imdbID?: string;
  Type: string;
  totalSeasons?: string;
  Response: 'True' | 'False';
  Error?: string;
}

export interface SearchState {
  title: string;
  year: string;
  type: string;
  page: number;
  total: number;
  items: OmdbSearchResultItem[];
  loading: boolean;
  error: string | null;
}
