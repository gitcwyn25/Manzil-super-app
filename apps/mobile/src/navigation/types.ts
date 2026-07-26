export type RootTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  ConciergeTab: undefined;
  SavedTab: undefined;
  ProfileTab: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Search: undefined;
  Concierge: undefined;
  Saved: undefined;
  Profile: undefined;
  BusinessDetail: { slug: string };
  Review: { slug: string };
};
