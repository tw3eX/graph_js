(function ($) {
	// значение по умолчанию - ЗЕЛЁНЫЙ
	// актуальные настройки, глобальные
	var options;
	var public_env = {
		init: function (params) {
			options = $.extend({}, private_env.defaults, options, params);
			//init dom
			private_env.init_dom.apply(this);
			private_env.bind_moving_events.apply(this);
			return this;
		},
		add_node: function (params) {
			node = $.extend({}, private_env.node_constructor, params);
			public_env.nodes.push(node);
			private_env.debug('Узел создан',node);
			return node;
		},
		add_edge: function (params) {
			edge = $.extend({}, private_env.edge_constructor, params);
			if(typeof public_env.nodes[edge.from] != 'object' || typeof public_env.nodes[edge.to] != 'object'){
					private_env.debug('Неверное соединение, соединяемые узлы не существуют',edge);
					return;
				}
			public_env.edges.push(edge);
			private_env.debug('Соединение создано',edge);
			return edge;
		},
		nodes: [],
		edges: [],
	};

	var private_env = {
		init_dom: function () {
			//очищаем div и устанавливаем отступы
			this.empty()
			this.attr('style', function (i, s) {
				return s + 'padding: 0px !important;'
			});
			//Спавним канвас
			var newCanvas = $('<canvas/>');
			newCanvas[0].height = this.height();
			newCanvas[0].width = this.width();
			newCanvas.addClass('main');
			jQuery(newCanvas).appendTo(this);

			var newCanvas = $('<canvas/>');
			newCanvas[0].height = this.height();
			newCanvas[0].width = this.width();
			newCanvas.addClass('hidden');
			jQuery(newCanvas).appendTo(this);


			private_env.debug('Canvas создан');
			//set context
			private_env.canvas = this.find('canvas.main')[0];
			private_env.context = private_env.canvas.getContext('2d');

			private_env.canvas_hidden = this.find('canvas.hidden')[0];
			private_env.context_hidden = private_env.canvas_hidden.getContext('2d');

			setInterval(private_env.render_all, 1000 / options.env_fps)
			
			
		},
		bind_moving_events: function () {

			//detect objects by mousemove
			$(private_env.canvas).mousemove(
			  function(e) {
				var rect = private_env.canvas.getBoundingClientRect();		        
		        x = e.clientX - rect.left
		        y = e.clientY - rect.top   

		        var p = private_env.context_hidden.getImageData(x, y, 1, 1).data; 
    			var hex = ("" + private_env.rgbToHex(p[0], p[1], p[2])).slice(-6);    
    			typeof public_env.nodes[hex*1-1] === 'object' ? 
    										document.body.style.cursor = 'pointer':
    										document.body.style.cursor = 'default';
    			if(private_env.env.moving === 1){
    				private_env.debug('Перетаскивание элемента', public_env.nodes[private_env.env.moving_node_index]);
    				public_env.nodes[private_env.env.moving_node_index].x = x;
    				public_env.nodes[private_env.env.moving_node_index].y = y;
    			}

			    //private_env.debug(x,y,hex*1-1,public_env.nodes[hex*1-1]);

			  }
			);

			$(private_env.canvas).mousedown(
			  function(e) {
				private_env.debug('clicked');
				var rect = private_env.canvas.getBoundingClientRect();		        
		        x = e.clientX - rect.left
		        y = e.clientY - rect.top   

		        var p = private_env.context_hidden.getImageData(x, y, 1, 1).data; 
    			var hex = ("" + private_env.rgbToHex(p[0], p[1], p[2])).slice(-6);    
    			
				if(typeof public_env.nodes[hex*1-1] === 'object'){

					private_env.debug('Начало перетаскивания', public_env.nodes[hex*1-1]);
					private_env.env.moving = 1;
					private_env.env.moving_node_index = hex*1-1;
				}
			  }
			);

			$(private_env.canvas).mouseup(
			  function(e) {				
			  	private_env.debug('Конец перетаскивания');
				private_env.env.moving = 0;
				private_env.env.moving_node_index = '';
			  }
			);


		},
		render_all: function () {
			private_env.context.clearRect(0, 0, private_env.canvas.width, private_env.canvas.height);
			private_env.render_edges();
			private_env.render_nodes();
			
		},
		render_nodes: function () {
			
			$.each(public_env.nodes, function (index, node) {
				private_env.context.beginPath();
				private_env.context.arc(node.x, node.y, node.radius, 0, 2 * Math.PI, false);
				private_env.context.fillStyle = node.color;
				private_env.context.fill();
				private_env.context.lineWidth = node.strokewidth;
				private_env.context.strokeStyle = node.stroke;
				private_env.context.stroke();
			});

			private_env.context_hidden.clearRect(0, 0, private_env.canvas_hidden.width, private_env.canvas_hidden.height);
			$.each(public_env.nodes, function (index, node) {
				
				private_env.context_hidden.beginPath();
				private_env.context_hidden.arc(node.x, node.y, node.radius, 0, 2 * Math.PI, false);
				private_env.context_hidden.fillStyle = private_env.pad(index*1+1,6);
				private_env.context_hidden.fill();
				private_env.context_hidden.lineWidth = node.strokewidth;
				private_env.context_hidden.strokeStyle = private_env.pad(index*1+1,6);
				private_env.context_hidden.stroke();
			});

		},
		render_edges: function () {
			
			$.each(public_env.edges, function (index, edge) {

				var vector_edge_x = public_env.nodes[edge.to].x - public_env.nodes[edge.from].x;
				var vector_edge_y = public_env.nodes[edge.to].y - public_env.nodes[edge.from].y;

				var vector_edge_long = Math.sqrt(vector_edge_x*vector_edge_x+ vector_edge_y*vector_edge_y); 
				
				var vector_edge_0_x = vector_edge_x / vector_edge_long;
				var vector_edge_0_y = vector_edge_y / vector_edge_long;

				var vector_edge_x_offset_from = vector_edge_0_x * public_env.nodes[edge.from].radius;
				var vector_edge_y_offset_from = vector_edge_0_y * public_env.nodes[edge.from].radius;

				var vector_edge_x_offset_to = vector_edge_0_x * public_env.nodes[edge.to].radius;
				var vector_edge_y_offset_to  = vector_edge_0_y * public_env.nodes[edge.to].radius

				
				


				private_env.context.beginPath();
			    private_env.context.lineWidth = edge.lineWidth;
			    private_env.context.strokeStyle = edge.color;
			    private_env.context.moveTo(public_env.nodes[edge.from].x + vector_edge_x_offset_from, public_env.nodes[edge.from].y + vector_edge_y_offset_from);
			    private_env.context.lineTo(public_env.nodes[edge.to].x - vector_edge_x_offset_to, public_env.nodes[edge.to].y - vector_edge_y_offset_to);
			    private_env.context.stroke();


			    private_env.context.beginPath();
				private_env.context.arc(public_env.nodes[edge.from].x + vector_edge_x_offset_from,  public_env.nodes[edge.from].y + vector_edge_y_offset_from, 5, 0, 2 * Math.PI, false);
				private_env.context.fillStyle = 'white';
				private_env.context.fill();
				private_env.context.lineWidth = '1';
				private_env.context.strokeStyle = 'black';
				private_env.context.stroke();

			});

		},
		pad: function (str, max) {
			str = str.toString();
			return str.length < max ? private_env.pad("0" + str, max) : str;

		},
		rgbToHex: function (r, g, b) {
		    if (r > 255 || g > 255 || b > 255)
		        throw "Invalid color component";
		    return ((r << 16) | (g << 8) | b).toString(16);
		},
		debug: function () {
			if (options.env_mode === 'development') {
				console.info(arguments);
			}
		},
		// some vars
		canvas: '',
		context: '',
		canvas_hidden: '',
		context_hidden: '',
		node_constructor: {
			name: 'node',
			x: 0,
			y: 0,
			radius: 30,
			color: '#000000',
			stroke: '#000000',
			strokewidth: 1
		},
		edge_constructor: {
			from: '',
			to: '',
			lineWidth: '1',
			color: '#000000',
			
		},
		env : {
			moving : 0,
			moving_node_index : ''
		},
		defaults: {
			env_mode: 'production',
			env_fps: '60'
		}
	};
	$.fn.graph = function (method) {
		// логика вызова метода
		if (public_env[method] && typeof public_env[method] === 'function') {
			return public_env[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return public_env.init.apply(this, arguments);
		} else {
			$.error('Метод с именем ' + method + ' не существует для jQuery.graph');
		}
	};
	return this;
})(jQuery);