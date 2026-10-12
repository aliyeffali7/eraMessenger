import client from "./client";

export function fetchAllUsers() {
  return client.get("/accounts/admin/users/");
}

export function createUser({ username, password, firstName, lastName }) {
  return client.post("/accounts/admin/users/create/", {
    username,
    password,
    first_name: firstName,
    last_name: lastName,
  });
}
