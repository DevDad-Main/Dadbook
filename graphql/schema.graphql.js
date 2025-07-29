import { buildSchema } from "graphql";

export const schema = buildSchema(`

  type TestData {
      text: String!
      views: Int!
    }
    type RootQuery {
      hello: TestData!
    }
    schema {
      query: RootQuery
    }
`);
