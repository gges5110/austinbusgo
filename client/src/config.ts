export const graphQLEndpoint =
  process.env.REACT_APP_API_BASE !== undefined
    ? `${process.env.REACT_APP_API_BASE}/graphql`
    : "/graphql";
