function CUtils(domain) {
    auth = BX24.getAuth();
    this.curSiteDomen = "https://"+auth.domain;
}

CUtils.prototype.showLinkForUser = function(userId, lastName, firstName) {
    if (userId <= 0) return "undefined";
    
    return '<a href="'+this.curSiteDomen+'/company/personal/user/'+userId+'/'+'" title="'+lastName+' '+firstName+'.'+'" target="_blank">'+lastName+' '+firstName.charAt(0)+'.'+'</a>';
}

CUtils.prototype.showLinkForGroup = function(groupId, groupName) {
    if (groupId <= 0 || groupName == "" || groupName == "undefined") return false;

    return '<a href="'+this.curSiteDomen+'/workgroups/group/'+groupId+'/'+'" target="_blank">'+groupName+'</a>';
}

CUtils.prototype.showLinkForTask = function(taskId, taskName, groupId, userId) {
    if (taskId <= 0 || taskName == "" || taskName == "undefined") return false;

    return groupId ? '<a href="'+this.curSiteDomen+'/workgroups/group/'+groupId+'/tasks/task/view/'+taskId+'/" target="_blank">'+taskName+'</a>':
    '<a href="'+this.curSiteDomen+'/company/personal/user/'+userId+'/tasks/task/view/'+taskId+'/" target="_blank">'+taskName+'</a>';
}

CUtils.prototype.EstimateTimeToHours = function(seconds) {
    if (!seconds) return 0;

    return (seconds/3600).toFixed(2);
}

CUtils.prototype.getTaskStatusById = function(statusId) {
    var arrStatusName = {
        1:"Новая",
        2:"В ожидании",
        3:"В прогрессе",
        4:"Утверждается",
        5:"Закрыта",
        6:"Отложена",
        7:"Отклонена"
    };

    return arrStatusName[statusId];
}

