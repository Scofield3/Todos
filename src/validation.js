define(["ajv",'text', 'text!./schemas/chema-read-delete-todo.json', 'text!../schemas/schema-create-todo.json', 'text!../schemas/schema-update-todo.json', 'text!../schemas/schema-general-todo.json'], function (Ajv, text, readDeleteText, createText, updateText, generalText){
    const ajv = new Ajv();
    let schema_read_delete_todo, schema_create_todo, schema_update_todo, schema_general_todo;

    schema_read_delete_todo = JSON.parse(readDeleteText);
    schema_create_todo = JSON.parse(createText);
    schema_update_todo = JSON.parse(updateText);
    schema_general_todo = JSON.parse(generalText);
    
    ajv.addSchema(schema_read_delete_todo, "read_delete_todo");
    ajv.addSchema(schema_create_todo, "create_todo");
    ajv.addSchema(schema_update_todo, "update_todo");
    ajv.addSchema(schema_general_todo, "general_todo");

    return {
        ajv,
        schema_read_delete_todo,
        schema_create_todo,
        schema_update_todo,
        schema_general_todo
    };
});