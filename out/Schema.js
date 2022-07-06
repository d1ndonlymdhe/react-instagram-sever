"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const graphql_2 = require("graphql");
const GraphUser = new graphql_2.GraphQLSchema({
    query: new graphql_2.GraphQLObjectType({
        name: "HelloWorld",
        fields: () => ({
            bio: {
                type: graphql_1.GraphQLString,
                resolve: () => "Hello World"
            },
        })
    })
});
exports.default = GraphUser;
