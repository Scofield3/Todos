const Ajv = require("ajv");
const schema_read_delete_todo = require("../schemas/chema-read-delete-todo.json");
const schema_create_todo = require("../schemas/schema-create-todo.json");
const schema_update_todo = require("../schemas/schema-update-todo.json");
const schema_general_todo = require("../schemas/schema-general-todo.json");

const ajv = new Ajv();
require("ajv-formats")(ajv);

ajv.addSchema(schema_read_delete_todo, "read_delete_todo");
ajv.addSchema(schema_create_todo, "create_todo");
ajv.addSchema(schema_update_todo, "update_todo");
ajv.addSchema(schema_general_todo, "general_todo");

module.exports = {
    ajv,
    schema_read_delete_todo,
    schema_create_todo,
    schema_update_todo,
    schema_general_todo
}