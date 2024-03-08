const _ = require('lodash');
const $ = require('jquery');
const validation = require("./validation")

$(function () {
    const apiMethods = {"Create": 1, "Update": 2, "Get": 3, "GetAll": 4, "Delete": 5}
    
    const readDeleteValidate = validation.ajv.getSchema("read_delete_todo");
    const createValidate = validation.ajv.getSchema("create_todo");
    const updateValidate = validation.ajv.getSchema("update_todo");


    function readURL(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            
            reader.onload = function (e) {
                $('#uploadedImg').attr('src', e.target.result);
            }
            
            reader.readAsDataURL(input.files[0]);
        }
    }

    async function readAllTodos() {
        const result = await readAllTodosRequest();

        const promises = [];

        result.result.forEach(res => {
            promises.push(ReadTodoRequest(res));
        });

        return Promise.all(promises)
    }

    async function deleteTodo(todoId){
        return await deleteTodoRequest(todoId);
    }

    //HERE ARE ACTUAL REQUESTS TO THE SERVER

    async function createTodoRequest(){
        const objToSend = {};

        _.forEach(validation.schema_create_todo.properties, function(details, property) {
            const id = 'input-' + property;
            
            if ($('#' + id).attr("type") !== "file") {
                objToSend[property] = $('#' + id).val();
                
                return;
            }
            
            if ($('#uploadedImg').attr("src") !== "#") {
                objToSend[property] = $('#uploadedImg').attr("src");
            }
        });

        if (!createValidate(objToSend)) {            
            return Promise.reject({error: true, message: validation.ajv.errorsText(createValidate.errors)});
        }

        return await $.ajax({
            url: "http://localhost:3000/CreateTodo",
            type: "POST",
            data: objToSend,
            dataType:'json'
        });
    }

    async function ReadTodoRequest(id) {
        const objToSend = {
            "id": parseInt(id)
        };
        
        if (!readDeleteValidate(objToSend)) {
            return Promise.reject({error: true, message: validation.ajv.errorsText(updateValidate.errors)});
        }

        return await $.ajax({
                url: "http://localhost:3000/ReadTodo",
                type: "GET",
                data: objToSend,
                dataType:'json'
            });
    }

    async function readAllTodosRequest() {
        return await $.ajax({
            url: "http://localhost:3000/ReadAllTodos",
            type: "GET"
        });
    }

    async function deleteTodoRequest(id) {
        const objToSend = {
            "id": id
        };

        if (!readDeleteValidate(objToSend)) {
            return Promise.reject({error: true, message: validation.ajv.errorsText(updateValidate.errors)});
        }

        return await $.ajax({
            url: "http://localhost:3000/DeleteTodo",
            type: "DELETE",
            data: objToSend
        });
    }

    async function updateTodoRequest(todoId){
        const objToSend = {
            "id": parseInt(todoId)
        };

        _.forEach(validation.schema_update_todo.properties, function(details, property) {
            if (property === "id") {
                return;
            }

            const id = 'input-' + property;
            const isBase64Pattern = !!details.pattern;

            const input = $("#" + id);

            if (!isBase64Pattern) {
                objToSend[property] = input.val();
                
                return;
            }
            
            if ($('#uploadedImg').attr("src") !== "#") {
                objToSend[property] = $('#uploadedImg').attr("src");
            }
        });

        if (!updateValidate(objToSend)) {
            return Promise.reject({error: true, message: validation.ajv.errorsText(updateValidate.errors)});
        }        

        return await $.ajax({
            url: "http://localhost:3000/UpdateTodo",
            type: "PATCH",
            data: objToSend,
            dataType:'json'
        });
    }

    //SHOW FUNCTIONS

    function createTodosTable(todos){
        const tableWrapper = $("<div id='tableWrapper'></div>");
        const table = $("<table id='tableTodos' class='table table-striped'></table>");
        const tableHead = $("<thead></thead>");
        const tableBody = $("<tbody></tbody>");

        let html = '';

        _.forEach(validation.schema_general_todo.properties, function(details, property) {
            html += '<th scope="col">' + _.startCase(property) + '</th>';
        });

        tableHead.append('<tr>' + html + '</tr>');

        todos.sort((a, b) => parseInt(a.id) - parseInt(b.id));

        const updateAndDeleteButton = "<td><button type='button' class='btn btn-secondary btn-sm updateButton'>Update Todo</button><button type='button' class='btn btn-secondary btn-sm deleteButton'>Delete Todo</button></td>";
        
        _.forEach(todos, function(todo) {
            const tableRow = $(`<tr></tr>`);
            let tableRowContent = "";

            _.forEach(validation.schema_general_todo.properties, function(details, property) {
                const isBase64Pattern = !!details.pattern;

                tableRow.attr("data-"+_.kebabCase(property), todo[_.snakeCase(property)]);

                if (isBase64Pattern) {
                    const imageSrc = todo[_.snakeCase(property)] !== null ? todo[_.snakeCase(property)] : "#";

                    tableRowContent += '<td><img alt="no img" height="100vh" src="' + imageSrc + '" /></td>';

                    return;
                }

                if (todo[_.snakeCase(property)] === null || todo[_.snakeCase(property)] === undefined) {
                    tableRowContent += '<td> no ' + _.lowerCase(property) + ' available</td>';
                    
                    return;
                }

                if (details.format && details.format === "date-time") {
                    const date = todo[_.snakeCase(property)];
                    
                    tableRowContent += '<td>' + new Date(date.replace(' ', 'T')) + '</td>';

                    return;
                }

                tableRowContent += '<td>' + todo[_.snakeCase(property)] + '</td>';
            });

            tableRow.append(tableRowContent + updateAndDeleteButton);
            tableBody.append(tableRow);
        });

        table.append(tableHead);
        table.append(tableBody);

        tableWrapper.append(table);

        $('#result-wrapper').append(tableWrapper);
    }

    function resetView(){
        $("#result-wrapper").empty();
        $('#todoModal').hide();
    }

    function showResult(method){
        resetView();

        switch (method) {
            case apiMethods.Create:
                console.log("CREATING TEST DIV FOR COMPLETED CREATE TODO!");
                $('#result-wrapper').append('<div id="createTest">THE TODO IS CREATED</div>');
                break;
            case apiMethods.Delete:
            case apiMethods.Update:
            case apiMethods.GetAll:
                readAllTodos()
                    .then((res) => {
                        const todos = _.map(res, function(ress) {
                            return ress.result;
                        });
                        
                        createTodosTable(todos);
                    })
                    .catch(err => {
                        console.log("Promise all error: " + err);
                    });

                break;
            case apiMethods.Get:
                break;
            default:
                break;
        }
    }

    function createTodoModal(todo, isUpdate){
        let modalTitle = "Create Todo";
        let schema = validation.schema_create_todo;
        let imgSrc = "#";
        //let buttonId = "createTodoReq";
        //let buttonText = "Create Todo";

        $("#buttonUpdateTodo").hide();

        if (isUpdate) {
            $("#createTodoReq").hide();
            $("#buttonUpdateTodo").show();

            schema = validation.schema_update_todo;
            modalTitle = "Uptade Todo: " + todo.title;
            //buttonId = "buttonUpdateTodo";
            //buttonText = "Update Todo";
        }

        $('#todoModal-title').text(modalTitle);

        if ($("#todoForm")) {
            $("#todoForm").remove();
        }

        const form = $("<form id='todoForm'></form>");
       
        _.forEach(schema.properties, function(details, property) {
            if (isUpdate) {
                $("#todoModalContent").attr("data-" + _.kebabCase(property), todo[_.snakeCase(property)]);
            }

            if (property === "id") {
                return;
            }

            const id = 'input-' + property;
            const isBase64Pattern = !!details.pattern;
            let type = "text";

            const label = $("<label>");
            label.attr("id", "label-" + id);
            label.text(_.startCase(property));

            if (isBase64Pattern) {
                type = "file";
            }

            const input = $("<input>");
            input.attr("type", type);
            input.attr("id", id);
            input.attr("name", property);

            if (_.includes(schema.required, property)) {
                input.attr("required", true);
            }

            if (isUpdate && !isBase64Pattern) {
                input.val(todo[_.snakeCase(property)]);
            }

            form.append(label);
            form.append(input);
            form.append("<br/>");

            if (isBase64Pattern) {
                if (isUpdate) {
                    imgSrc = todo[_.snakeCase(property)];
                }

                var img = $('<img id="uploadedImg">');
                img.attr("src", imgSrc);
                img.attr("height", "100vh");
                img.attr("alt", "your image");

                form.append(img);
                form.append("<br/>");

                $('#todos').off('change').on('change', '#' + id + '', (evt) => {
                    readURL(evt.target);
                });
            }
        });

        $('.modal-body').append(form);

        $('#todoModal').show();
    }

    //LISTENERS

    $('#createTodo').on('click', () => {
        createTodoModal();
    });

    $('#readAllTodos').on('click', () => {
        showResult(apiMethods.GetAll);
    });

    $('.buttonCancelTodo').on('click', () => {
        $('#todoModal').hide();
    });


    //BINDINGS OF DYNAMICALLY CREATED BUTTONS

    $('#todos').on('click', '#createTodoReq', async () => {
        await createTodoRequest()
            .then((res) => {
                console.log("res: ", res);
                showResult(apiMethods.Create);
            })
            .catch(err => {
                console.log("Create todo error: ", err);
            });
    });

    $('#todos').on('click', '#buttonUpdateTodo', async (evt) => {
        const buttonParent = $(evt.target).parent().parent();

        await updateTodoRequest(buttonParent.attr("data-id"))
            .then((res) => {
                showResult(apiMethods.Update);
            })
            .catch(err => {
                console.log("Update todo error: ", err.message);
            });
    });

    $('#todos').on('click', '.updateButton', (evt) => {
        const buttonParent = $(evt.target).parent().parent();

        createTodoModal($(buttonParent).data(), true);
    });

    $('#todos').on('click', '.deleteButton', async (evt) => {
        const buttonParent = $(evt.target).parent().parent();

        await deleteTodo(buttonParent.attr('data-id'))
            .then((res) => {
                showResult(apiMethods.Delete);
            })
            .catch(err => {
                console.log("Delete todo error: ", err.message);
            });
    });
});