;(function () {
    'use strict';

    var $form_add_task = $('.add-task'),
        $window = $(window),
        $body = $('body'),
        task_list = [],
        $delete_task,
        $task_detail = $('.task-detail'),
        $task_detail_mask = $('.task-detail-mask'),
        $detail_task,
        current_index,
        $update_from,
        $task_detail_content,
        $task_detail_content_input,
        $checkbox_complete,
        $msg = $('.msg'),
        $msg_content = $msg.find('.msg-content'),
        $msg_confirm = $msg.find('.confirmed'),
        $alerter = $('.alerter');


    init();


    function  listen_msg_event(){
        $msg_confirm.on('click',function(){
            hide_notify();
        })
    }

    function pop(arg){
        if(!arg){
            console.error('pop title is required');
        }

        var conf = {},
            $box,
            $mask,
            $title,
            $content,
            $confirm,
            $cancel,
            dfd,
            timer,
            confirmed;

        dfd = $.Deferred();

        if(typeof arg == 'string'){
            conf.title = arg;
        }
        else {
            conf = $.extend(conf,arg);
        }


        $box = $('<div>' +
            '<div class="pop-title">' + conf.title + '</div>' +
            '<div class="pop-content">' +
            '<div>' +
            '<button style="margin-right: 5px" class="primary confirm">确定</button>' +
            '<button class="cancel">取消</button></div>' +
            '</div>' +
            '</div>').css({
            color:'#444',
            position:'fixed',
            width:300,
            height:'auto',
            padding:'15px 10px',
            background:'#fff',
            'border-radius': '3px',
            'box-shadow': '0 1px 2px 1px rgba(0,0,0,0.5)'
        });

        $title = $box.find('.pop-title').css({
           padding: '5px 10px',
            'font-weight': 900,
            'font-size':'20px',
            'text-align':'center'
        });

        $content = $box.find('.pop-content').css({
            padding: '5px 10px',
            'text-align':'center'
        });

        $confirm = $content.find('button.confirm');
        $cancel = $content.find('button.cancel');


        $mask = $('<div></div>').css({
            position:'fixed',
            background:'rgba(0,0,0,.5)',
            top:0,
            bottom:0,
            left:0,
            right:0
        });

        timer = setInterval(function(){
            if(confirmed !== undefined){
                dfd.resolve(confirmed);
                clearInterval(timer);
                dismiss_pop();
            }
        },50);



        $confirm.on('click',function(){
            confirmed = true;
        });
        $cancel.on('click',function(){
            confirmed = false;
        });
        $mask.on('click',function(){
            confirmed = false;
        });
        function dismiss_pop(){
            $mask.remove();
            $box.remove();
        }

        function adjust_box_position(){
            var window_width = $window.width(),
                window_height = $window.height(),
                box_width = $box.width(),
                box_height = $box.height(),
                move_x,
                move_y;

            move_x = (window_width - box_width) / 2;
            move_y = (window_height - box_height) / 2 - 20;

            $box.css({
                left: move_x,
                top: move_y
            })
        }

        $window.on('resize',function(){
            adjust_box_position();
        });


        $mask.appendTo($body);
        $box.appendTo($body);

        adjust_box_position();

        return dfd.promise();
    }

    $form_add_task.on('submit',function(e){
        var new_task = {};
        // 禁用默认行为
        e.preventDefault();
        // 获取新Task的值
        var $input = $(this).find('input[name=content]');
        new_task.content = $input.val();
        // 如果新Task的值为空 直接返回 否则继续执行
        if(!new_task.content) {
            return;
        }
        // 存入新Task
        if(add_task(new_task)){
            //render_task_list();
            $input.val(null);
        }
    });

    $task_detail_mask.on('click',function(e){
        hide_task_detail();
    });

    function  listen_task_delete(){
        $delete_task.on('click',function(){
            var $this = $(this);
            var $item = $this.parent().parent();
            var index = parseInt($item.data('index'));
            pop('确定删除？')
                .then(function(r){
                    r ? delete_task(index) : null;
                });
        });
    }

    function listen_task_detail(){

        var index;

        $('.task-item').on('dblclick',function(){
            var $this = $(this).parent().parent();
            index = $this.data('index');
            show_task_detail(index);
        });

        $detail_task.on('click',function(){
            var $this = $(this).parent().parent();
            index = $this.data('index');
            show_task_detail(index);
        })
    }

    function listen_checkbox_complete(){
        $checkbox_complete.on('click',function(){
            var is_complete = $(this).is(':checked');
            var $this = $(this);
            var index = $this.parent().parent().data('index');
            var item = get(index);

            if(item.complete){
                update_task(index,{complete: false});
            }
            else {
                update_task(index,{complete: true});
            }
        })
    }
    function update_task(index, data){
        if(index === undefined || task_list[index] === undefined){
            return;
        }

        task_list[index] = $.extend({},task_list[index],data);
        refresh_task_list();
    }

    function get(index){
        return store.get('task_list')[index];
    }

    // 查看task详情
    function show_task_detail(index){

        render_task_detail(index);
        current_index = index;
        $task_detail_mask.show(600);
        $task_detail.show(600);
    }

    function hide_task_detail(){
        $task_detail_mask.hide(600);
        $task_detail.hide(600);
    }

    // 渲染指定task的详细信息
    function render_task_detail(index){

        if(index === undefined || task_list[index] === undefined){
            return;
        }


        var item = task_list[index];

        var tpl = '<form>' +
        '<div class ="content">' +
            item.content +
            '</div>' +
            '<div class="input_item"><input style="display: none" type="text" name="content" value="' +
            (item.content || '') +
            '"></div>' +
            '<div>' +
            '<div class="desc input_item">' +
            '<textarea name = "desc">' + (item.desc || '') + '</textarea>' +
            '</div>' +
            '</div>' +
            '<div class="remind input_item">' +
            '<input class = "input_item datetime" name="remain_date" type="text" value="' + (item.remian_date || '') + '">' +
            '<button  type="submit">update</button>' +
            '</div>' +
            '</form>';

        $task_detail.html(null);
        $task_detail.html(tpl);
        $('.datetime').datetimepicker();

        $update_from = $task_detail.find('form');
        $task_detail_content = $update_from.find('.content');
        $task_detail_content_input = $update_from.find('[name = content]');

        $task_detail_content.on('dblclick',function(){
            $task_detail_content_input.show();
            $task_detail_content.hide();
        });

        $update_from.on('submit',function(e){
            e.preventDefault();
            var data = {};
            data.content = $(this).find('[name = content]').val();
            data.desc = $(this).find('[name = desc]').val();
            data.remian_date = $(this).find('[name = remain_date]').val();

            update_task(index,data);

            hide_task_detail();
        })
    }

    function add_task(new_task){

        // 将新task推入task——list
        task_list.unshift(new_task);
        // 更新localStorage
        refresh_task_list();
        return true;
    }

    // 更新localStorage 并更渲染模板
    function refresh_task_list(){
        store.set('task_list',task_list);
        render_task_list();
    }

    function delete_task(index){
        // 如果没有index 或者不存在
        if(index === undefined || task_list[index] === undefined){
            return;
        }

        delete task_list[index];
        refresh_task_list();

    }

    function init(){
        task_list = store.get('task_list') || [];
        if(task_list.length){
            render_task_list();
        }
        task_remind_check();
    }

    function task_remind_check(){
        var current_timestamp;
        var itl = setInterval(function(){
            for(var i = 0; i < task_list.length; i++){
                var item = get(i),
                    task_timestamp;
                if(!item || !item.remian_date || item.informed){
                    continue;
                }

                current_timestamp = (new Date()).getTime();
                task_timestamp = (new Date(item.remian_date)).getTime();
                if(current_timestamp - task_timestamp >= 1){
                    update_task(i,{informed: true});
                    show_notify(item.content);
                }

            }
        },300);
    }

    function show_notify(msg){
        $msg_content.html(msg);
        $alerter.get(0).play();
        $msg.show();
    }
    function hide_notify(){
        $msg.hide();
    }

    function render_task_list(){
        var $task_list = $('.task-list');

        $task_list.html('');
        var complete_item = [];
       for(var i = 0; i < task_list.length; i++){
           var item = task_list[i];
           if(item && item.complete ){
               complete_item[i] = item;
           }else {
               var $task = render_task_item(item,i);
           }

           $task_list.append($task);
       }

        for(var j = 0; j < complete_item.length; j++){
            item = complete_item[j];
            if(!item){
                continue;
            }

            $task = render_task_item(item,j);
            $task.addClass('completed');
            $task_list.append($task);
        }

        $delete_task  = $('.action.delete');
        $detail_task = $('.action.detail');
        $checkbox_complete = $('.task-list .complete[type=checkbox]');
        listen_task_delete();
        listen_task_detail();
        listen_checkbox_complete();
        listen_msg_event();

    }

    function render_task_item(data, index){
        //task list 的模板
        if(!data || index === undefined){
            return;
        }
        var list_item_tpl = '<div class="task-item" data-index="' + index + '">' +
            '<span><input class="complete"' +  (data.complete ? 'checked' : '')  + ' type="checkbox"></span>' +
            '<span class="task-content">' + data.content + '</span>'+
            '<span class="fr">' +
            '<span class="action delete"> 删除</span>' +
            '<span class="action detail"> 详细</span>' +
            '</span>' +
            '</div>';
            return $(list_item_tpl);
    }
})();