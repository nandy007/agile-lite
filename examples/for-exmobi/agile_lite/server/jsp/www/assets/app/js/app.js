//启动agile
var $config = {
	exmobiSevice: '${$native.getAppSetting().domain}/process/service/${ClientUtil.getAppId()}'
};

A.launch({
	readyEvent: 'ready', //触发ready的事件，在ExMobi中为plusready
	backEvent: 'backmonitor',
	crossDomainHandler: function(opts) {
		$util.server(opts);
	}
});
$(document).on(A.options.clickEvent, '#ratchet_form_article span', function() {
	A.alert('提示', $(this).attr('class').replace(/.* /, ''));
	return false;
});