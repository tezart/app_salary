// our application constructor
function application () {



    //init filter calendars
    var date = new Date(), y = date.getFullYear(), m = date.getMonth();
    var firstDay = new Date(y, m, 1);
    var lastDay = new Date(y, m + 1, 0);

    firstDay = moment(firstDay);
    lastDay = moment(lastDay);

    $('#date_fld_start').datetimepicker({
     language: 'ru',
     pickTime: false,
     format: "DD.MM.YYYY",
     defaultDate: moment(firstDay)
    });

    $('#date_fld_finish').datetimepicker({
        language: 'ru',
        pickTime: false,
        format: "DD.MM.YYYY",
        defaultDate: moment(lastDay)
    });



    //this.Install();
    this.InitEvents();
    this.InitOptions();
}

application.prototype.Install = function() {
    auth = BX24.getAuth();
    access_token = auth.access_token;

    // создаем необходимые пользовательские поля
    BX24.callMethod(
        'task.item.userfield.add',
        [
            {
                'USER_TYPE_ID': 'boolean',
                'FIELD_NAME': 'COMPLETED_APP',
                'XML_ID': 'COMPLETED_APP',
                'EDIT_FORM_LABEL': {
                    'en': 'Completed [APP]',
                    'ru': 'Проведено [APP]'
                },
                'LABEL': 'Проведено [APP]'
            }
        ],

        function(result)
        {
            console.info(result.data());
            console.log(result);
        }
    );

    //создаем необходимые инфоблоки
    BX24.callMethod('entity.add',
        {
            'ENTITY': 'salary',
            'NAME': 'Ставки сотрудников',
            'ACCESS': {U1:'W',AU:'D'}
        },
        function() {
            BX24.callMethod('entity.item.property.add', {ENTITY: 'salary', PROPERTY: 'user_id', NAME: 'Пользователь', TYPE: 'S'});
            BX24.callMethod('entity.item.property.add', {ENTITY: 'salary', PROPERTY: 'salary_hour', NAME: 'Сумма за час', TYPE: 'S'});
        }
    );
}
application.prototype.InitEvents = function() {
    curapp = this;

    /*
    * filter
    * */
    $('#app_filter_start').on('click', function() {
        curapp.displayTasks();
    });

    /*
    * options
    * */
    $('#rate_employee_options').on('click', function(e) {
        e.preventDefault();
    });
}
application.prototype.InitOptions = function () {
    $('.add-new-employee-salary .add-new-employee').on('click', function() {

        var _this = this;
        BX24.selectUser(function(user) {
            $(_this).val(user.name);
            $(_this).data('uid', user.id);
        });
    });
}

/*
* common functions
* */
application.prototype.resizeFrame = function () {

    var currentSize = BX24.getScrollSize();
    minHeight = currentSize.scrollHeight;

    if (minHeight < 400) minHeight = 400;
    BX24.resizeWindow(this.FrameWidth, minHeight);

}

application.prototype.saveFrameWidth = function () {
    this.FrameWidth = document.getElementById("app").offsetWidth;
}

/*
 * application functions
 * */
application.prototype.displayErrorMessage = function(message) {
	$('#deal-list').html(message);
	$('#deal-sum').html(message);
}

application.prototype.displayCurrentUser = function(selector) {
	BX24.callMethod('user.current', {}, function(result){
		$(selector).html(result.data().NAME + ' ' + result.data().LAST_NAME);
	});
}

application.prototype.getTasks = function() {
    
}

application.prototype.getFilterForTasks = function() {
    return {
        ">=CLOSED_DATE": moment($('#date_fld_start').val(), 'DD.MM.YYYY').format('YYYY-MM-DD'),
        "<=CLOSED_DATE": moment($('#date_fld_finish').val(), 'DD.MM.YYYY').format('YYYY-MM-DD'),
    }
}

application.prototype.displayTasks = function () {
	var tasks = new Array();
    var groups = {};
    var tasksHTML = '';
	var curapp = this;


    //получаем задачи
    var mainPromise = new Promise(
        function(resolve, reject) {
            BX24.callMethod(
                'task.item.list',
                [
                    {CREATED_DATE : 'desc'},
                    curapp.getFilterForTasks(),
                    {    
                        NAV_PARAMS: { // постраничка
                            nPageSize : 50,    // по 2 элемента на странице.
                        }
                    }
                ],
                function(result)
                {
                    var data = result.data();
                    
                    for (indexDeal in data) {
                        tasks.push(data[indexDeal]); 
                    }
                                
                    if (result.more())
                        result.next();
                    else
                        resolve();
                }
            );                  
        }
    )
   //получаем группы
   .then(function() {
        return new Promise(function(resolve,reject) {
                var groupsIds = new Array();
                
                for (index in tasks) {
                    if (tasks[index].GROUP_ID > 0)
                    {
                        groupsIds.push(tasks[index].GROUP_ID);
                    }
                }

                BX24.callMethod('sonet_group.get', {'FILTER': {'ID': groupsIds}},
                    function(result)
                    {
                        var data = result.data();
                        for (indexGroup in data) {
                            groups[data[indexGroup].ID] = data[indexGroup];
                        }
                        
                        if (result.more())
                            result.next();
                        else
                            resolve(); 
                    }
                );
            }
        )    
    })
    //выводим информацию на экран
    .then(
        function() {

            for (index in tasks) {

                var taskTime = oUtils.EstimateTimeToHours(tasks[index].TIME_ESTIMATE);

                //todo получаем рейт разработчика и умножаем его на количество часов
                //var responsibleCost =
                //todo считаем маржу, стоимость по клиенту - стоимость затрат
                //var marge =



                tasksHTML += '<tr><th scope="row">'
                    + tasks[index].ID + '</th><td>' 
                    + oUtils.showLinkForTask(tasks[index].ID, tasks[index].TITLE, tasks[index].GROUP_ID, tasks[index].RESPONSIBLE_ID) + '</td><td>'
                    + (tasks[index].GROUP_ID > 0 ? oUtils.showLinkForGroup(tasks[index].GROUP_ID, groups[tasks[index].GROUP_ID].NAME): 'Нет группы') + '</td><td>'
                    + oUtils.getTaskStatusById(tasks[index].STATUS) + '</td><td>'
                    + moment(tasks[index].CREATED_DATE).format('DD.MM.YYYY') + '</td><td>'
                    + moment(tasks[index].CLOSED_DATE).format('DD.MM.YYYY') + '</td><td>'
                    + taskTime + '</td><td>'
                    + tasks[index].TICKET_COST + '</td><td>'
                    + oUtils.showLinkForUser(tasks[index].RESPONSIBLE_ID, tasks[index].RESPONSIBLE_LAST_NAME, tasks[index].RESPONSIBLE_NAME) + '</td><td>'
                    + oUtils.showLinkForUser(tasks[index].CREATED_BY, tasks[index].CREATED_BY_LAST_NAME, tasks[index].CREATED_BY_NAME) + '</td><td>'
                    + tasks[index].MARGE + '</td>'
                '</tr>';
            }
            
            $('#tasks-list').html(tasksHTML);

            curapp.resizeFrame();
        }
    );
}


