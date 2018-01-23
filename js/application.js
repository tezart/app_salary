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

    $('#rate_client_options').on('shown.bs.modal', function (e) {
        $('.choose-client-name').chosen({'width':'300px'});
    })


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

    BX24.callMethod('entity.add',
        {
            'ENTITY': 'client_rates',
            'NAME': 'Ставки клиентов',
            'ACCESS': {U1:'W',AU:'D'}
        },
        function() {
            BX24.callMethod('entity.item.property.add', {ENTITY: 'client_rates', PROPERTY: 'soc_group_id', NAME: 'Id социальной группы', TYPE: 'S'});
            BX24.callMethod('entity.item.property.add', {ENTITY: 'client_rates', PROPERTY: 'hour_cost', NAME: 'Сумма за час', TYPE: 'S'});
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
    var employye_rates = new Array();
    var usersHTML = '';

    BX24.callMethod('entity.item.get', {
            ENTITY: 'salary',
            SORT: {NAME: 'ASC'},
            FILTER: {}
        },
        function(result) {
            var data = result.data();

            if (data.length > 0) {
                $('#rate_employee_list .table-placeholder').hide();
            }

            for (indexRates in data) {
                usersHTML += '<tr><td>'+data[indexRates]['NAME']+'</td><td>'+data[indexRates]['PROPERTY_VALUES'].salary_hour+'</td><td><span class="badge badge-pill badge-danger destroy-rate" data-user-id="'+data[indexRates]['ID']+'">удалить</span></td></tr>'; ;
            }

            if (result.more()) {
                result.next();
            }
            else {
                $('#rate_employee_list').append(usersHTML);
            }

        }
    );

    $('.add-new-employee-salary .add-new-employee').on('click', function() {
        var _this = this;
        BX24.selectUser(function(user) {
            $(_this).val(user.name);
            $(_this).data('uid', user.id);
        });
    });

    $('.add-new-employee-salary .add-new-rate').on('click', function() {
        var _this = this;
        user_id = $(_this).parent().find('.add-new-employee').data('uid');
        user_name = $(_this).parent().find('.add-new-employee').val();
        user_rate = $(_this).parent().find('.add-new-employee-rate').val();

        $(_this).prop( "disabled", true );

        BX24.callMethod('entity.item.add', {
                ENTITY: 'salary',
                NAME: user_name,
                PROPERTY_VALUES: {
                    user_id: user_id,
                    salary_hour: user_rate
                },
            },
            function(result)
            {
                if (result.data() > 0) {
                    userRateId = result.data();
                    userHTML = '<tr><td>'+user_name+'</td><td>'+user_rate+'</td><td><span class="badge badge-pill badge-danger destroy-rate" data-user-id="'+userRateId+'">удалить</span></td></tr>';
                    $('#rate_employee_list').prepend(userHTML);

                    $('#rate_employee_list .table-placeholder').hide();
                }
                else {
                    alert('Ошибка добавления');
                }
                $(_this).prop("disabled", false);
            }
        );
    })

    $('#rate_employee_list').on('click', '.destroy-rate', function() {
        var _this = this;
        user_id = $(_this).data('user-id');

        BX24.callMethod('entity.item.delete', {
                ENTITY: 'salary',
                ID: user_id
            },
            function(result){
                if (result.data())
                {
                    $(_this).parents('tr').remove();

                    if ($('#rate_employee_list .destroy-rate').length == 0) {
                        $('#rate_employee_list .table-placeholder').show();
                    }
                }
                else {
                    alert('Ошибка удаления');
                }
            }
        );
    })

    /**
     init options for client
    */
    var soc_groups_HTML = '';
    BX24.callMethod('sonet_group.get', {
            'ORDER': {'NAME': 'ASC'},
            'FILTER': {'CLOSED':'N', 'ACTIVE':'Y'}
        },
        function(result) {
            var data = result.data();

            if (data.length > 0) {

            }

            for (indexRates in data) {
                soc_groups_HTML += '<option value="'+data[indexRates].ID+'">'+data[indexRates].NAME+'</option>';
            }

            if (result.more()) {
                result.next();
            }
            else {
                $('#client_groups_select').append(soc_groups_HTML);
            }
        }
    );

    var clientRatesHTML = '';
    BX24.callMethod('entity.item.get', {
            ENTITY: 'client_rates',
            SORT: {NAME: 'ASC'},
            FILTER: {}
        },
        function(result) {
            var data = result.data();

            if (data.length > 0) {
                $('#rate_client_list .table-placeholder').hide();
            }

            for (indexRates in data) {
                clientRatesHTML += '<tr><td>'+data[indexRates]['NAME']+'</td><td>'+data[indexRates]['PROPERTY_VALUES'].hour_cost+'</td><td><span class="badge badge-pill badge-danger destroy-rate" data-user-id="'+data[indexRates]['ID']+'">удалить</span></td></tr>'; ;
            }

            if (result.more()) {
                result.next();
            }
            else {
                $('#rate_client_list').append(clientRatesHTML);
            }
        }
    );

    $('.add-new-client-rate .add-new-client-rate').on('click', function() {
        var _this = this;
        soc_groupId = $('#client_groups_select').val();
        soc_group_name = $('#client_groups_select option:selected').text();
        client_rate = $('.client-rate').val();

        $(_this).prop( "disabled", true );

        BX24.callMethod('entity.item.add', {
                ENTITY: 'client_rates',
                NAME: soc_group_name,
                PROPERTY_VALUES: {
                    soc_group_id: soc_groupId,
                    hour_cost: client_rate
                },
            },
            function(result)
            {
                if (result.data() > 0) {
                    clientRateId = result.data();
                    userHTML = '<tr><td>'+soc_group_name+'</td><td>'+client_rate+'</td><td><span class="badge badge-pill badge-danger destroy-rate" data-user-id="'+clientRateId+'">удалить</span></td></tr>';
                    $('#rate_client_list').prepend(userHTML);

                    $('#rate_client_list .table-placeholder').hide();
                }
                else {
                    alert('Ошибка добавления');
                }
                $(_this).prop("disabled", false);
            }
        );
    })

    $('#rate_client_list').on('click', '.destroy-rate', function() {
        var _this = this;
        user_id = $(_this).data('user-id');

        BX24.callMethod('entity.item.delete', {
                ENTITY: 'client_rates',
                ID: user_id
            },
            function(result){
                if (result.data())
                {
                    $(_this).parents('tr').remove();

                    if ($('#rate_client_list .destroy-rate').length == 0) {
                        $('#rate_client_list .table-placeholder').show();
                    }
                }
                else {
                    alert('Ошибка удаления');
                }
            }
        );
    })
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
    var groupsIds = new Array();
    var responsible_rates = {};
    var soc_group_rates = {};
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
        return new Promise(function(resolve, reject) {
                var responsibleIds = new Array();

                for (index in tasks) {
                    if (tasks[index].GROUP_ID > 0)
                    {
                        groupsIds.push(tasks[index].GROUP_ID);
                        responsibleIds.push(tasks[index].RESPONSIBLE_ID);
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
    //получаем рейты ответственных
    .then(function() {
        return new Promise(function(resolve, reject) {
            var responsibleIds = new Array();

            for (index in tasks) {
                if (tasks[index].RESPONSIBLE_ID > 0)
                {
                    responsibleIds.push(tasks[index].RESPONSIBLE_ID);
                }
            }

            if (responsibleIds.length > 0) {
                BX24.callMethod('entity.item.get', {
                        ENTITY: 'salary',
                        SORT: {},
                        FILTER: {'PROPERTY_USER_ID': responsibleIds}
                    },
                    function (result) {
                        var data = result.data();
                        //console.log(data);
                        for (indexRates in data) {
                            responsible_rates[data[indexRates]['PROPERTY_VALUES']['user_id']] = data[indexRates];
                        }

                        if (result.more())
                            result.next();
                        else
                            resolve();
                    }
                );
            }
        })
    })
    //получаем рейты клиентов
    .then(function() {
        return new Promise(function(resolve, reject) {
            console.log('get_cl_rates', groupsIds);
            if (groupsIds.length > 0) {
                BX24.callMethod('entity.item.get', {
                        ENTITY: 'client_rates',
                        SORT: {},
                        FILTER: {}
                    },
                    function (result) {
                        var data = result.data();
                        console.log(data);
                        for (indexRates in data) {
                            soc_group_rates[data[indexRates]['PROPERTY_VALUES']['soc_group_id']] = data[indexRates];
                        }

                        if (result.more())
                            result.next();
                        else
                            resolve();
                    }
                );
            }
        })
    })
    //выводим информацию на экран
    .then(
        function() {
            console.log('here');
            for (index in tasks) {

                var taskTime = oUtils.EstimateTimeToHours(tasks[index].TIME_ESTIMATE);

                //получаем рейт разработчика и умножаем его на количество часов
                var responsibleCost = '0';
                if (responsible_rates[tasks[index].RESPONSIBLE_ID])
                    responsibleCost = taskTime * responsible_rates[tasks[index].RESPONSIBLE_ID]['PROPERTY_VALUES']['salary_hour'];
                console.log(soc_group_rates);
                console.log(tasks[index].GROUP_ID);
                var clientCost = '0';
                if (soc_group_rates[tasks[index].GROUP_ID])
                    clientCost = taskTime * soc_group_rates[tasks[index].GROUP_ID]['PROPERTY_VALUES']['hour_cost'];

                //считаем маржу, стоимость по клиенту - стоимость затрат
                var marge = 0;
                marge = clientCost - responsibleCost;

                tasksHTML += '<tr><th scope="row">'
                    + tasks[index].ID + '</th><td>' 
                    + oUtils.showLinkForTask(tasks[index].ID, tasks[index].TITLE, tasks[index].GROUP_ID, tasks[index].RESPONSIBLE_ID) + '</td><td>'
                    + (tasks[index].GROUP_ID > 0 ? oUtils.showLinkForGroup(tasks[index].GROUP_ID, groups[tasks[index].GROUP_ID].NAME): 'Нет группы') + '</td><td>'
                    + oUtils.getTaskStatusById(tasks[index].STATUS) + '</td><td>'
                    + moment(tasks[index].CREATED_DATE).format('DD.MM.YYYY') + '</td><td>'
                    + moment(tasks[index].CLOSED_DATE).format('DD.MM.YYYY') + '</td><td>'
                    + taskTime + '</td><td>'
                    + clientCost + '</td><td>'
                    + responsibleCost + '</td><td>'
                    + oUtils.showLinkForUser(tasks[index].RESPONSIBLE_ID, tasks[index].RESPONSIBLE_LAST_NAME, tasks[index].RESPONSIBLE_NAME) + '</td><td>'
                    + oUtils.showLinkForUser(tasks[index].CREATED_BY, tasks[index].CREATED_BY_LAST_NAME, tasks[index].CREATED_BY_NAME) + '</td><td>'
                    + marge + '</td>'
                '</tr>';
            }
            
            $('#tasks-list').html(tasksHTML);

            curapp.resizeFrame();
        }
    );
}


