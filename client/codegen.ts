import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "http://localhost:5001/graphql",
  documents: ["src/shared/api/schemas/*.tsx"],
  ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    "src/shared/types/interface.d.tsx": { plugins: ["typescript"] },
    "src/": {
      preset: "near-operation-file",
      presetConfig: {
        extension: ".generated.ts",
        baseTypesPath: "~shared/types/interface.d",
      },
      config: {
        exposeQueryKeys: true,
        exposeFetcher: true,
        fetcher: {
          endpoint: "graphQLEndpoint",
          fetchParams: {
            headers: {
              "Content-Type": "application/json",
            },
          },
        },
        namingConvention: {
          typeNames: "pascal-case#pascalCase",
          enumValues: "keep",
        },
      },
      plugins: [
        "typescript-operations",
        "typescript-react-query",
        {
          add: {
            content: "import { graphQLEndpoint } from 'config/config';",
          },
        },
      ],
    },
  },
  hooks: {
    afterAllFileWrite: ["prettier --write", "eslint --fix"],
  },
};

export default config;
