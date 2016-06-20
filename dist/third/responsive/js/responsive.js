A.Controller.add({
	collapse: {
		selector: '[data-toggle="collapse"]',
		isToggle: true //仅控制目标显隐
	},
	toggleclass: {
		selector: '[data-toggle="toggleclass"]',
		handler: function(hash, el) {
			var $el = $(el),
				tempClassName = $el.data('toggleclass'),
				$targetElement = $(hash);

			if ($targetElement.hasClass(tempClassName)) {
				$targetElement.removeClass(tempClassName);
			} else {
				$targetElement.addClass(tempClassName);
			}
		}
	}
});

A.Component.add({
	slider: {
		selector: '[data-role="article"].active',
		event: 'articleload',
		objectArray: [],
		handler: function(el, roleType) {
			var _objectArray = this.objectArray;

			var _work = function($el) {
				var id = $el.attr('id');

				if (_objectArray[id]) {
					return _objectArray[id];
				}

				var returnObj = new Slider($el);

				_objectArray[id] = returnObj;

				return returnObj;
			};

			var $el = $(el);

			if ($el.data('role') == 'slider') {
				return _work($el);
			} else {
				var comps = $el.find('[data-role="slider"]');
				for (var i = 0; i < comps.length; i++) {
					_work($(comps[i]));
				}
			}

			function Slider($el) {
				var _this = this;

				this.options = {
					autoplay: true,
					loop: true,
					dot: false
				};

				try {
					var dataOptions = eval("(" + $el.data('options') + ")");
					if (typeof dataOptions === 'object') {
						$.extend(_this.options, dataOptions);
					}
				} catch (e) {}

				this.$container = $el.find('.slide-container');

				this.goto = function(index) {
					this.$container = $el.find('.slide-container');

					var slide_elements = this.$container.find('.slide');

					if (isNaN(index)) {
						return;
					}

					this.$container.addClass('slide-animation');

					this.$container.removeClass('slider-centre');

					if (index > 0) {
						if (this.index < (slide_elements.length - 1)) {
							this.index++;
						} else {
							this.index = 0;
						}

						this.$container.addClass('slider-right');
					} else {
						if (this.index > 0) {
							this.index--;
						} else {
							this.index = slide_elements.length - 1;
						}

						this.$container.addClass('slider-left');
					}

					setTimeout(function() {
						_this.$container.removeClass('slide-animation');
						_this.draw();
						_this.autoplay();
					}, 500);
				};

				this.draw = function() {
					this.$container = $el.find('.slide-container');

					var slide_elements = this.$container.find('.slide');

					if (slide_elements.length === 1) {
						$(slide_elements.get(0)).addClass('show');

						_clearPostionClass(this.$container);

						this.$container.addClass('slider-left');

						return;
					}

					if (slide_elements.length === 2) {
						$(slide_elements.get(0)).addClass('show');
						$(slide_elements.get(1)).addClass('show');

						if (this.index === 0) {
							_clearPostionClass(this.$container);

							this.$container.addClass('slider-left');
						} else {
							_clearPostionClass(this.$container);

							this.$container.addClass('slider-centre');
						}

						return;
					}

					if (slide_elements.length === (this.index + 1)) {
						if (!this.options.loop) {
							return;
						}
						this.$container.append($(slide_elements.get(0)));
						this.index--;
					} else if (0 === this.index) {
						if (!this.options.loop) {
							return;
						}
						this.$container.prepend($(slide_elements.get(slide_elements.length - 1)));
						this.index++;
					}


					slide_elements = this.$container.find('.slide');

					_clearPostionClass(this.$container);

					slide_elements.removeClass('show');

					$(slide_elements.get(this.index - 1)).addClass('show');
					$(slide_elements.get(this.index)).addClass('show');
					$(slide_elements.get(this.index + 1)).addClass('show');

					this.$container.addClass('slider-centre');
				};

				this.autoplay = function() {
					var time = null;

					if (!this.options.autoplay) {
						return;
					}

					this.$container = $el.find('.slide-container');

					var slide_elements = this.$container.find('.slide');

					if (!this.options.loop && this.index == (slide_elements.length - 1)) {
						return;
					}

					if (this.options.autoplay === true) {
						time = 2000;
					} else {
						time = this.options.autoplay;
					}

					setTimeout(function() {
						_this.goto(1);
					}, time);
				};

				function _clearPostionClass($el) {
					$el.removeClass('slider-centre');
					$el.removeClass('slider-right');
					$el.removeClass('slider-left');
				}

				this.index = 0;

				this.draw();

				this.autoplay();
			}
		}
	}
});