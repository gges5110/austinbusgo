export const graphQLEndpoint =
  import.meta.env.VITE_API_BASE !== undefined
    ? `${import.meta.env.VITE_API_BASE}/graphql`
    : "/graphql";
