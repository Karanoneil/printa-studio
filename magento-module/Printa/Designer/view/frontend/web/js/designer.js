/**
 * Printa Designer — Magento 2 frontend component.
 * Bridges the PDP "Customize & Design" button with the Printa embed
 * loader (embed.js) and carries the completed design into the
 * add-to-cart buy request via a hidden input.
 */
define([
    'jquery',
    'uiComponent',
    'mage/validation'
], function ($, Component) {
    'use strict';

    return Component.extend({
        defaults: {
            origin: '',
            product: {},
            designer: null,        // Printa designer instance
            design: null,          // completed StudioDesign JSON
            previewPng: null
        },

        /**
         * @inheritdoc
         */
        initialize: function () {
            this._super();

            var self = this;

            var boot = function () {
                if (!window.Printa) {
                    // embed.js still loading — retry shortly
                    return setTimeout(boot, 120);
                }
                self.designer = window.Printa.create('#printa-designer-root', {
                    origin: self.origin,
                    product: self.product,
                    onComplete: function (result) {
                        self.design = result.design;
                        self.previewPng = result.previewPng;

                        // stash design on the add-to-cart form as a buyRequest option
                        var form = $('#product_addtocart_form');
                        if (form.length) {
                            form.find('input[name="printa_design"]').remove();
                            $('<input>')
                                .attr('type', 'hidden')
                                .attr('name', 'printa_design')
                                .val(JSON.stringify(result.design))
                                .appendTo(form);
                            form.find('input[name="printa_preview"]').remove();
                            $('<input>')
                                .attr('type', 'hidden')
                                .attr('name', 'printa_preview')
                                .val(result.previewPng)
                                .appendTo(form);
                        }

                        // surface a small preview + edit affordance near the button
                        var host = $('#printa-designer-root');
                        host.find('.printa-preview').remove();
                        var preview = $('<div class="printa-preview">').css({
                            'margin-top': '10px',
                            'display': 'flex',
                            'align-items': 'center',
                            'gap': '10px'
                        });
                        $('<img>')
                            .attr('src', result.previewPng)
                            .css({ 'max-width': '96px', 'border-radius': '8px', 'border': '1px solid #ddd' })
                            .appendTo(preview);
                        $('<span>')
                            .text('Design saved with this product \u2713')
                            .css({ 'font-size': '13px', 'color': '#0a0' })
                            .appendTo(preview);
                        preview.appendTo(host);
                    },
                    onCancel: function () {
                        // keep any previously saved design
                    }
                });
            };

            boot();

            return this;
        }
    });
});
