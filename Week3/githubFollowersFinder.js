// TODO - HTTP endpoints for quering social graphs

//  POST /createGraphFor - accepts a JSON in the form:
//{
//    "username": "kunev",
//    "depth": 3
//}
//and returns a unique graph id, which we will use to query the graph.



//    GET /graph/{graphId} - returns the social graph for the given graphId.
// If the graph has not been created yet, return a message that says so.




//    GET /mutually_follow/{graphId}/{username} - this methods checks for the social graph with graphId
// and the given {username} the following thing: