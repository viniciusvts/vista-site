/* global WPHB_Admin */
/* global wphb */

/**
 * Asset Optimization scripts.
 *
 * @package
 */

import Fetcher from '../utils/fetcher';
import { __, getLink } from '../utils/helpers';
import Row from '../minification/Row';
import RowsCollection from '../minification/RowsCollection';
import Scanner from '../minification/Scanner';

( function ( $ ) {
	'use strict';

	WPHB_Admin.minification = {
		module: 'minification',
		$checkFilesResultsContainer: null,
		checkURLSList: null,
		checkedURLS: 0,

		init() {
			const self = this;

			// Init files scanner.
			this.scanner = new Scanner(
				wphb.minification.get.totalSteps,
				wphb.minification.get.currentScanStep
			);
			this.scanner.onFinishStep = this.updateProgressBar;

			// Check files button.
			$( '#check-files' ).click( function ( e ) {
				e.preventDefault();
				$( document ).trigger( 'check-files' );
			} );

			$( document ).on( 'check-files', function () {
				window.SUI.openModal(
					'check-files-modal',
					'wpbody-content',
					undefined,
					false
				);

				$( this ).attr( 'disabled', true );
				self.updateProgressBar( self.scanner.getProgress() );
				self.scanner.scan();
			} );

			// Cancel scan button.
			$( 'body' ).on( 'click', '#cancel-minification-check', ( e ) => {
				e.preventDefault();
				this.updateProgressBar( 0, true );
				this.scanner.cancel().then( () => {
					window.location.href = getLink( 'minification' );
				} );
			} );

			// Track changes done to minification files.
			$(
				':input.toggle-checkbox, :input[id*="wphb-minification-include"]'
			).on( 'change', function () {
				const row = $( this ).closest( '.wphb-border-row' );
				const rowStatus = row.find( 'span.wphb-row-status-changed' );
				$( this ).toggleClass( 'changed' );
				if ( row.find( '.changed' ).length !== 0 ) {
					rowStatus.removeClass( 'sui-hidden' );
				} else {
					rowStatus.addClass( 'sui-hidden' );
				}
				const changed = $( '.wphb-minification-files' ).find(
					'input.changed'
				);
				if ( changed.length !== 0 ) {
					$( '#wphb-publish-changes' ).removeClass( 'disabled' );
				} else {
					$( '#wphb-publish-changes' ).addClass( 'disabled' );
				}
			} );

			// Enable/disable bulk update button.
			$(
				':input.wphb-minification-file-selector, :input.wphb-minification-bulk-file-selector'
			).on( 'change', function () {
				$( this ).toggleClass( 'changed' );
				const changed = $( '.wphb-minification-files' ).find(
					'input.changed'
				);
				const bulkUpdateButton = $(
					'.sui-actions-left > #bulk-update'
				);

				if ( changed.length === 0 ) {
					bulkUpdateButton.addClass( 'button-notice disabled' );
				} else {
					bulkUpdateButton.removeClass( 'button-notice disabled' );
				}
			} );

			// Filter action button on Asset Optimization page
			$( '#wphb-minification-filter-button' ).on( 'click', function () {
				$( '.wphb-minification-filter' ).toggle( 'slow' );
				$( '#wphb-minification-filter-button' ).toggleClass( 'active' );
			} );

			// Discard changes button click
			$( '.wphb-discard' ).on( 'click', function ( e ) {
				e.preventDefault();

				if ( confirm( __( 'discardAlert' ) ) ) {
					location.reload();
				}
				return false;
			} );

			// Enable discard button on any change
			$( '.wphb-enqueued-files input' ).on( 'change', function () {
				$( '.wphb-discard' ).attr( 'disabled', false );
			} );

			// CDN checkbox update status
			const checkboxes = $( 'input[type=checkbox][name=use_cdn]' );
			checkboxes.change( function () {
				$( '#cdn_file_exclude' ).toggleClass( 'sui-hidden' );
				const cdnValue = $( this ).is( ':checked' );

				// Handle two CDN checkboxes on Asset Optimization page
				checkboxes.each( function () {
					this.checked = cdnValue;
				} );

				// Update CDN status
				Fetcher.minification.toggleCDN( cdnValue ).then( () => {
					WPHB_Admin.notices.show();
				} );
			} );

			// Exclude file buttons.
			const excludeButtons = $(
				'.wphb-minification-exclude > :input.toggle-checkbox'
			);
			excludeButtons.on( 'change', function () {
				const row = $( this ).closest( '.wphb-border-row' );
				row.toggleClass( 'disabled' );
				const label = $(
					"label[for='" + $( this ).attr( 'id' ) + "']"
				);
				if ( label.hasClass( 'fileIncluded' ) ) {
					label.find( 'i' ).removeClass( 'sui-icon-eye-hide' ).addClass( 'sui-icon-eye' );
					label.attr( 'data-tooltip', wphb.strings.includeFile );
					label.removeClass( 'fileIncluded' );
				} else {
					label.find( 'i' ).removeClass( 'sui-icon-eye' ).addClass( 'sui-icon-eye-hide' );
					label.attr( 'data-tooltip', wphb.strings.excludeFile );
					label.addClass( 'fileIncluded' );
				}
			} );

			/**
			 * Regenerate individual file.
			 *
			 * @since 1.9.2
			 */
			$( '.wphb-compressed .wphb-filename-extension' ).on(
				'click',
				function () {
					const row = $( this ).closest( '.wphb-border-row' );

					row.find( '.fileinfo-group' ).removeClass(
						'wphb-compressed'
					);

					row.find( '.wphb-row-status' )
						.removeClass( 'sui-hidden wphb-row-status-changed' )
						.addClass(
							'wphb-row-status-queued sui-tooltip-constrained'
						)
						.attr( 'data-tooltip', wphb.strings.queuedTooltip )
						.find( 'i' )
						.attr( 'class', 'sui-icon-loader sui-loading' );

					Fetcher.minification.resetAsset(
						row.attr( 'data-filter' )
					);
				}
			);

			$( 'input[type=checkbox][name=debug_log]' ).change( function () {
				const enabled = $( this ).is( ':checked' );
				Fetcher.minification.toggleLog( enabled ).then( () => {
					WPHB_Admin.notices.show();
					if ( enabled ) {
						$( '.wphb-logging-box' ).show();
					} else {
						$( '.wphb-logging-box' ).hide();
					}
				} );
			} );

			/**
			 * Save critical css file
			 */
			$( '#wphb-minification-tools-form' ).on( 'submit', function ( e ) {
				e.preventDefault();

				const spinner = $( this ).find( '.spinner' );
				spinner.addClass( 'visible' );

				Fetcher.minification
					.saveCriticalCss( $( this ).serialize() )
					.then( ( response ) => {
						spinner.removeClass( 'visible' );
						if (
							'undefined' !== typeof response &&
							response.success
						) {
							WPHB_Admin.notices.show( response.message );
						} else {
							WPHB_Admin.notices.show(
								response.message,
								'error'
							);
						}
					} );
			} );

			/**
			 * Parse custom asset dir input
			 *
			 * @since 1.9
			 */
			const textField = document.getElementById( 'file_path' );
			if ( null !== textField ) {
				textField.onchange = function ( e ) {
					e.preventDefault();
					Fetcher.minification
						.updateAssetPath( $( this ).val() )
						.then( ( response ) => {
							if ( response.message ) {
								WPHB_Admin.notices.show(
									response.message,
									'error'
								);
							} else {
								WPHB_Admin.notices.show();
							}
						} );
				};
			}

			/**
			 * Asset optimization network settings page.
			 *
			 * @since 2.0.0
			 */

			// Show/hide settings, based on checkbox value.
			$( '#wphb-network-ao' ).on( 'click', function () {
				$( '#wphb-network-border-frame' ).toggleClass( 'sui-hidden' );
			} );

			// Handle settings select.
			$( '#wphb-box-minification-network-settings' ).on(
				'change',
				'input[type=radio]',
				function ( e ) {
					const divs = document.querySelectorAll(
						'input[name=' + e.target.name + ']'
					);

					// Toggle logs frame.
					if ( 'log' === e.target.name ) {
						$( '.wphb-logs-frame' ).toggle( e.target.value );
					}

					for ( let i = 0; i < divs.length; ++i ) {
						divs[ i ].parentNode.classList.remove( 'active' );
					}

					e.target.parentNode.classList.add( 'active' );
				}
			);

			// Submit settings.
			$( '#wphb-ao-network-settings' ).on( 'click', function ( e ) {
				e.preventDefault();

				const spinner = $( '.sui-box-footer' ).find( '.spinner' );
				spinner.addClass( 'visible' );

				const form = $( '#ao-network-settings-form' ).serialize();
				Fetcher.minification
					.saveNetworkSettings( form )
					.then( ( response ) => {
						spinner.removeClass( 'visible' );
						if (
							'undefined' !== typeof response &&
							response.success
						) {
							WPHB_Admin.notices.show();
						} else {
							WPHB_Admin.notices.show(
								wphb.strings.errorSettingsUpdate,
								'error'
							);
						}
					} );
			} );

			/**
			 * Register exclude CDN select and submit settings.
			 *
			 * @since 2.4.0
			 */
			const excludeCDN = $( '#cdn_exclude' );
			excludeCDN.SUIselect2();

			$( '#wphb-ao-settings-update' ).on( 'click', function ( e ) {
				e.preventDefault();

				const spinner = $( '.sui-box-footer' ).find( '.spinner' );
				spinner.addClass( 'visible' );

				const data = self.getMultiSelectValues( 'cdn_exclude' );

				Fetcher.minification
					.updateExcludeList( JSON.stringify( data ) )
					.then( () => {
						spinner.removeClass( 'visible' );
						WPHB_Admin.notices.show();
					} );
			} );

			/**
			 * Asset optimization 2.0
			 *
			 * @since 2.6.0
			 */

			/**
			 * This is such a weird piece of code. Unfortunately, it was written during the sad time
			 * when my coffee machine broke down. Sorry.
			 * Increment the WTF Counter if you've checked it out and went like "Huh???"
			 *
			 * wtf_counter = 2
			 */
			const modeToggles = document.querySelectorAll(
				'[name=asset_optimization_mode]'
			);
			let current = 'auto';
			for ( let i = 0; i < modeToggles.length; i++ ) {
				// Set the current selection.
				if ( true === modeToggles[ i ].checked ) {
					current = modeToggles[ i ].value;
				}

				modeToggles[ i ].addEventListener( 'click', function () {
					// Ignore clicking on the selected value.
					if ( current === this.value ) {
						return;
					}

					// Visually switch toggles.
					document
						.getElementById( 'wphb-ao-' + current + '-label' )
						.classList.add( 'active' );
					document
						.getElementById( 'wphb-ao-' + this.value + '-label' )
						.classList.remove( 'active' );

					if ( 'auto' === current && 'manual' === this.value ) {
						window.SUI.openModal(
							'wphb-advanced-minification-modal',
							'wphb-switch-to-advanced',
							'wphb-switch-to-advanced',
							false
						);
						return;
					}

					if ( 'manual' === current && 'auto' === this.value ) {
						if ( true === wphb.minification.get.showSwitchModal ) {
							window.SUI.openModal(
								'wphb-basic-minification-modal',
								'wphb-switch-to-basic',
								'wphb-switch-to-basic',
								false
							);
						} else {
							WPHB_Admin.minification.switchView( 'basic' );
						}
					}
				} );
			}

			// Toggle Speedy settings on/off.
			const inputSpeedy = document.getElementById( 'wphb-speedy-toggle' );
			if ( inputSpeedy ) {
				inputSpeedy.addEventListener( 'change', ( el ) => {
					const elEnable = el.target.checked ? 'basic' : 'speedy';
					const elDisable = el.target.checked ? 'speedy' : 'basic';

					this.toggleAutoViewBox( elEnable, elDisable );

					document.getElementById(
						'wphb-basic-toggle'
					).checked = ! el.target.checked;
				} );
			}

			const inputBasic = document.getElementById( 'wphb-basic-toggle' );
			if ( inputBasic ) {
				inputBasic.addEventListener( 'change', ( el ) => {
					const elEnable = el.target.checked ? 'speedy' : 'basic';
					const elDisable = el.target.checked ? 'basic' : 'speedy';

					this.toggleAutoViewBox( elEnable, elDisable );

					document.getElementById(
						'wphb-speedy-toggle'
					).checked = ! el.target.checked;
				} );
			}

			// Initialize multi select fields.
			$( '#wphb-ao-speedy-exclude' ).SUIselect2();
			$( '#wphb-ao-basic-exclude' ).SUIselect2();

			// How does it work? stuff.
			const expandButtonManual = document.getElementById(
				'manual-ao-hdiw-modal-expand'
			);
			if ( expandButtonManual ) {
				expandButtonManual.onclick = function () {
					document
						.getElementById( 'manual-ao-hdiw-modal' )
						.classList.remove( 'sui-modal-sm' );
					document
						.getElementById( 'manual-ao-hdiw-modal-header-wrap' )
						.classList.remove( 'sui-box-sticky' );
				};
			}

			const collapseButtonManual = document.getElementById(
				'manual-ao-hdiw-modal-collapse'
			);
			if ( collapseButtonManual ) {
				collapseButtonManual.onclick = function () {
					document
						.getElementById( 'manual-ao-hdiw-modal' )
						.classList.add( 'sui-modal-sm' );
					const el = document.getElementById( 'manual-ao-hdiw-modal-header-wrap' );
					if( el.classList.contains( 'video-playing' ) ) {
						el.classList.add( 'sui-box-sticky' );
					}
				};
			}

			// How does it work? stuff.
			const expandButtonAuto = document.getElementById(
				'automatic-ao-hdiw-modal-expand'
			);
			if ( expandButtonAuto ) {
				expandButtonAuto.onclick = function () {
					document
						.getElementById( 'automatic-ao-hdiw-modal' )
						.classList.remove( 'sui-modal-sm' );
				};
			}

			const collapseButtonAuto = document.getElementById(
				'automatic-ao-hdiw-modal-collapse'
			);
			if ( collapseButtonAuto ) {
				collapseButtonAuto.onclick = function () {
					document
						.getElementById( 'automatic-ao-hdiw-modal' )
						.classList.add( 'sui-modal-sm' );
				};
			}

			/**
			 * Asset Optimization filters
			 *
			 * @type {RowsCollection|*}
			 */
			this.rowsCollection = new WPHB_Admin.minification.RowsCollection();

			const rows = $( '.wphb-border-row' );

			rows.each( function ( index, row ) {
				let _row;
				if ( $( row ).data( 'filter-secondary' ) ) {
					_row = new WPHB_Admin.minification.Row(
						$( row ),
						$( row ).data( 'filter' ),
						$( row ).data( 'filter-secondary' )
					);
				} else {
					_row = new WPHB_Admin.minification.Row(
						$( row ),
						$( row ).data( 'filter' )
					);
				}
				self.rowsCollection.push( _row );
			} );

			// Filter search box
			const filterInput = $( '#wphb-s' );
			// Prevent enter submitting form to rescan files.
			filterInput.keydown( function ( e ) {
				if ( 13 === e.keyCode ) {
					event.preventDefault();
					return false;
				}
			} );
			filterInput.keyup( function () {
				self.rowsCollection.addFilter( $( this ).val(), 'primary' );
				self.rowsCollection.applyFilters();
			} );

			// Filter dropdown
			$( '#wphb-secondary-filter' ).change( function () {
				self.rowsCollection.addFilter( $( this ).val(), 'secondary' );
				self.rowsCollection.applyFilters();
			} );

			// Refresh rows on any filter change
			$( '.filter-toggles' ).change( function () {
				const element = $( this );
				const what = element.data( 'toggles' );
				const value = element.prop( 'checked' );
				const visibleItems = self.rowsCollection.getVisibleItems();

				for ( const i in visibleItems ) {
					visibleItems[ i ].change( what, value );
				}
			} );

			// Files selectors
			const filesList = $( 'input.wphb-minification-file-selector' );
			filesList.on( 'click', function () {
				const $this = $( this );
				const element = self.rowsCollection.getItemById(
					$this.data( 'type' ),
					$this.data( 'handle' )
				);
				if ( ! element ) {
					return;
				}

				if ( $this.is( ':checked' ) ) {
					element.select();
				} else {
					element.unSelect();
				}
			} );

			/**
			 * Handle select/deselect of all files of a certain type for
			 * use on bulk update.
			 *
			 * @type {*|jQuery|HTMLElement}
			 */
			const selectAll = $( '.wphb-minification-bulk-file-selector' );
			selectAll.click( function () {
				const $this = $( this );
				const items = self.rowsCollection.getItemsByDataType(
					$this.attr( 'data-type' )
				);
				for ( const i in items ) {
					if ( items.hasOwnProperty( i ) ) {
						if ( $this.is( ':checked' ) ) {
							items[ i ].select();
						} else {
							items[ i ].unSelect();
						}
					}
				}
			} );

			/* Show details of minification row on mobile devices */
			$( 'body' ).on( 'click', '.wphb-border-row', function () {
				if ( window.innerWidth < 783 ) {
					$( this ).find( '.wphb-minification-row-details' ).toggle();
					$( this ).find( '.fileinfo-group' ).toggleClass( 'opened' );
				}
			} );

			/**
			 * Catch window resize and revert styles for responsive dive
			 * 1/4 of a second should be enough to trigger during device
			 * rotations (from portrait to landscape mode)
			 *
			 * @type {debounced}
			 */
			const minificationResizeRows = _.debounce( function () {
				if ( window.innerWidth >= 783 ) {
					$( '.wphb-minification-row-details' ).css(
						'display',
						'flex'
					);
				} else {
					$( '.wphb-minification-row-details' ).css(
						'display',
						'none'
					);
				}
			}, 250 );

			window.addEventListener( 'resize', minificationResizeRows );

			return this;
		},

		updateProgressBar( progress, cancel = false ) {
			if ( progress > 100 ) {
				progress = 100;
			}
			// Update progress bar
			$( '.sui-progress-block .sui-progress-text span' ).text(
				progress + '%'
			);
			$( '.sui-progress-block .sui-progress-bar span' ).width(
				progress + '%'
			);
			if ( progress >= 90 ) {
				$( '.sui-progress-state .sui-progress-state-text' ).text(
					'Finalizing...'
				);
			}
			if ( cancel ) {
				$( '.sui-progress-state .sui-progress-state-text' ).text(
					'Cancelling...'
				);
			}
		},

		/**
		 * Switch from advanced to basic view.
		 * Called from switch view modal.
		 *
		 * @param {string}  mode
		 * @param {boolean} clear    Clear settings or not.
		 * @param {boolean} refresh  Refresh page.
		 */
		switchView( mode, clear = false, refresh = true ) {
			let hide = false;
			if ( 'basic' === mode ) {
				const trackBox = document.getElementById( 'hide-this-modal' );
				if ( trackBox && true === trackBox.checked ) {
					hide = true;
				}
			}

			Fetcher.minification.toggleView( mode, clear, hide ).then( () => {
				if ( refresh ) {
					window.location.href = getLink( 'minification' );
				}
			} );
		},

		/**
		 * Go to the Asset Optimization files page.
		 *
		 * @since 1.9.2
		 * @since 2.1.0  Added show_tour parameter.
		 * @since 2.6.0  Remove show_tour parameter.
		 */
		goToSettings() {
			window.SUI.closeModal();

			Fetcher.minification
				.toggleCDN( $( 'input#enable_cdn' ).is( ':checked' ) )
				.then( () => {
					window.location.href = getLink( 'minification' );
				} );
		},

		/**
		 * Get all selected values from multiselect.
		 *
		 * @since 2.6.0
		 *
		 * @param {string} id  Select ID.
		 * @return {{styles: [], scripts: []}}  Styles & scripts array.
		 */
		getMultiSelectValues( id ) {
			const selected = $( '#' + id ).find( ':selected' );

			const data = { scripts: [], styles: [] };

			for ( let i = 0; i < selected.length; ++i ) {
				data[ selected[ i ].dataset.type ].push( selected[ i ].value );
			}

			return data;
		},

		/**
		 * Reset auto asset optimization settings.
		 *
		 * @since 2.6.0
		 *
		 * @param {Object} e  Sender.
		 */
		resetAutoSettings( e ) {
			// Enable loader animation.
			e.classList.add( 'sui-button-onload-text' );
			e.setAttribute( 'disabled', 'disabled' );

			Fetcher.common.call( 'wphb_ao_reset_settings' ).then( () => {
				// Disable loader animation.
				e.classList.remove( 'sui-button-onload-text' );
				e.removeAttribute( 'disabled' );
				WPHB_Admin.notices.show( wphb.strings.successReset );
			} );
		},

		/**
		 * Save auto asset optimization settings.
		 *
		 * @since 2.6.0
		 *
		 * @param {Object} e  Sender.
		 */
		saveAutoSettings( e ) {
			// Enable loader animation.
			e.classList.add( 'sui-button-onload-text' );
			e.setAttribute( 'disabled', 'disabled' );

			const type = document.querySelector(
				'input[name="wphb-auto-toggle"]:checked'
			).dataset.type;
			const css = document.getElementById( 'wphb-ao-' + type + '-css' );
			const js = document.getElementById( 'wphb-ao-' + type + '-js' );

			const data = this.getMultiSelectValues(
				'wphb-ao-' + type + '-exclude'
			);

			Fetcher.minification
				.saveSettings( {
					type: type ? type : 'speedy',
					styles: css ? css.checked : false,
					scripts: js ? js.checked : false,
					data: JSON.stringify( data ),
				} )
				.then( () => {
					// Disable loader animation.
					e.classList.remove( 'sui-button-onload-text' );
					e.removeAttribute( 'disabled' );

					WPHB_Admin.notices.show( wphb.strings[ type + 'Saved' ], 'success', false );

					// Allow opening a "how-to" modal from the notice.
					const noticeLink = document.getElementById(
						'wphb-basic-hdiw-link'
					);
					if ( noticeLink ) {
						noticeLink.addEventListener( 'click', () => {
							window.SUI.closeNotice( 'wphb-ajax-update-notice' );
							window.SUI.openModal(
								'automatic-ao-hdiw-modal-content',
								'automatic-ao-hdiw-modal-expand'
							);
						} );
					}
				} );
		},

		/**
		 * Toggle the auto config boxes (speedy, basic).
		 *
		 * @since 2.6.0
		 *
		 * @param {string} show  Accepts: speedy, basic.
		 * @param {string} hide  Accepts: speedy, basic.
		 */
		toggleAutoViewBox( show, hide ) {
			document
				.getElementById( 'wphb-' + show + '-ao-box' )
				.classList.add( 'wphb-close-section' );

			document
				.getElementById( 'wphb-' + hide + '-ao-box' )
				.classList.remove( 'wphb-close-section' );
		},

		/**
		 * Skip upgrade.
		 *
		 * @since 2.6.0
		 */
		skipUpgrade() {
			Fetcher.common.call( 'wphb_ao_skip_upgrade' ).then( () => {
				window.location.href = getLink( 'minification' );
			} );
		},

		/**
		 * Perform AO upgrade.
		 *
		 * @since 2.6.0
		 */
		doUpgrade() {
			Fetcher.common.call( 'wphb_ao_do_upgrade' ).then( () => {
				window.location.href = getLink( 'minification' );
			} );
		},
	}; // End WPHB_Admin.minification

	WPHB_Admin.minification.Row = Row;
	WPHB_Admin.minification.RowsCollection = RowsCollection;
} )( jQuery );
