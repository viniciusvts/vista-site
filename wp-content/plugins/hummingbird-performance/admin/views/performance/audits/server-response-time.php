<?php
/**
 * Reduce server response times (TTFB) audit.
 *
 * @since 2.0.0
 * @package Hummingbird
 *
 * @var stdClass $audit  Audit object.
 */

use Hummingbird\Core\Utils;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

?>

<h4><?php esc_html_e( 'Overview', 'wphb' ); ?></h4>
<p>
	<?php esc_html_e( "Time To First Byte identifies the time it takes for a visitor's browser to receive the first byte of page content from the server. Ideally, TTFB for your server should be under 600 ms. ", 'wphb' ); ?>
</p>

<h4><?php esc_html_e( 'Status', 'wphb' ); ?></h4>
<?php if ( isset( $audit->errorMessage ) && ! isset( $audit->score ) ) {
	$this->admin_notices->show_inline( /* translators: %s - error message */
		sprintf( esc_html__( 'Error: %s', 'wphb' ), esc_html( $audit->errorMessage ) ),
		'error'
	);
	return;
}
?>
<?php if ( isset( $audit->score ) && 1 === $audit->score ) : ?>
	<?php
	$this->admin_notices->show_inline(
		sprintf( /* translators: %s - number of ms */
			esc_html__( 'Nice! TTFB for your server was %s.', 'wphb' ),
			esc_html( str_replace( 'Root document took ', '', $audit->displayValue ) )
		)
	);
	?>
<?php else : ?>
	<?php
	$this->admin_notices->show_inline(
		sprintf( /* translators: %s - number of ms */
			esc_html__( 'It took %s to receive the first byte of page content.', 'wphb' ),
			esc_html( str_replace( 'Root document took ', '', $audit->displayValue ) )
		),
		\Hummingbird\Core\Modules\Performance::get_impact_class( $audit->score )
	);
	?>

	<h4><?php esc_html_e( 'How to fix', 'wphb' ); ?></h4>
	<ol>
		<?php if ( ! isset( $_SERVER['WPMUDEV_HOSTED'] ) ) : ?>
			<li>
				<?php
				if ( ! apply_filters( 'wpmudev_branding_hide_branding', false ) ) {
					printf(
						/* translators: %1$s - link to Hosting project page, %2$s - closing a tag */
						esc_html__( 'TTFB largely depends on your server’s performance capacity. Host your website on %1$sWPMU DEV Hosting%2$s which comes with features such as dedicated resources, object caching, support for the latest PHP versions, and a blazing fast CDN.', 'wphb' ),
						'<a href="' . esc_html( Utils::get_link( 'hosting', 'hummingbird_test_ttfb_hosting_upsell_link' ) ) . '" target="_blank">',
						'</a>'
					);
					?>
						<div class="wphb-upsell-performance-row">
							<img class="sui-image sui-upsell-image"
								src="<?php echo esc_url( WPHB_DIR_URL . 'admin/assets/image/hosting.png' ); ?>"
								srcset="<?php echo esc_url( WPHB_DIR_URL . 'admin/assets/image/hosting@2x.png' ); ?> 2x"
								alt="<?php esc_attr_e( 'WPMU DEV Hosting', 'wphb' ); ?>">
							<?php
							$this->admin_notices->show_inline(
								sprintf( /* translators: %1$s - opening a tag, %2$s - </a> */
									esc_html__( 'WPMU DEV Hosting gives you fully dedicated resources (no shared hosting or IPs), object and page caching, and a blazing fast CDN. %1$sTry it for free today with a WPMU DEV membership%2$s.', 'wphb' ),
									'<a href="' . esc_html( Utils::get_link( 'hosting', 'hummingbird_test_response_time_hosting_upsell_learnmore_button' ) ) . '" target="_blank">',
									'</a>'
								),
								'upsell',
								sprintf( /* translators: %1$s - opening a tag, %2$s - </a> */
									esc_html__( '%1$sLearn More%2$s', 'wphb' ),
									'<a href="' . esc_html( Utils::get_link( 'hosting', 'hummingbird_test_response_time_hosting_upsell_learnmore_button' ) ) . '" target="_blank" class="sui-button sui-button-purple">',
									'</a>'
								)
							);
							?>
						</div>
					<?php
				} else {
					esc_html_e( 'TTFB largely depends on your server’s performance capacity. Considering switching to a host which comes with features such as dedicated resources, object caching, support for the latest PHP versions, and a blazing fast CDN.', 'wphb' );
				}
				?>
			</li>
		<?php else : ?>
			<li>
				<?php esc_html_e( 'If yours is a high traffic site, upgrade your server resources to improve your server response time.', 'wphb' ); ?>

				<?php if ( ! apply_filters( 'wpmudev_branding_hide_branding', false ) ) : ?>
					<div class="wphb-upsell-performance-row">
						<img class="sui-image sui-upsell-image"
							src="<?php echo esc_url( WPHB_DIR_URL . 'admin/assets/image/hosting.png' ); ?>"
							srcset="<?php echo esc_url( WPHB_DIR_URL . 'admin/assets/image/hosting@2x.png' ); ?> 2x"
							alt="<?php esc_attr_e( 'WPMU DEV Hosting', 'wphb' ); ?>">
						<?php
						$this->admin_notices->show_inline(
							esc_html__( 'Check out our Silver, Gold and Platinium plans with more SSD Storage space and up to 16 GB RAM. For even more power you can check out our enterprise WordPress Multisite hosting.', 'wphb' ),
							'upsell',
							sprintf( /* translators: %1$s - opening a tag, %2$s - </a> */
								esc_html__( '%1$sView Plans%2$s', 'wphb' ),
								'<a href="' . esc_html( Utils::get_link( 'hosting', 'hummingbird_test_response_time_hosting_upsell_learnmore_button' ) ) . '" target="_blank" class="sui-button sui-button-purple">',
								'</a>'
							)
						);
						?>
					</div>
				<?php endif; ?>
			</li>
		<?php endif; ?>

		<?php if ( ! Utils::get_module( 'page_cache' )->is_active() ) : ?>
			<li>
				<?php esc_html_e( "Enable Hummingbird's page caching. This can substantially improve your server response time for logged out visitors and search engine bots.", 'wphb' ); ?>
				<?php if ( $url = Utils::get_admin_menu_url( 'caching' ) ) : ?>
					<br><a href="<?php echo esc_url( $url ); ?>" class="sui-button">
						<?php esc_html_e( 'Configure Page Caching', 'wphb' ); ?>
					</a>
				<?php endif; ?>
			</li>
		<?php endif; ?>

		<?php if ( isset( $_SERVER['WPMUDEV_HOSTED'] ) && ! apply_filters( 'wpmudev_branding_hide_branding', false ) ) : ?>
			<li>
				<?php
				printf(
					/* translators: %1$s - link to Hosting project page, %2$s - closing a tag */
					esc_html__( 'If yours is a high traffic site, upgrade your server resources to improve your server response time. Check out the upgrade plans for your WPMU DEV hosting %1$shere%2$s.', 'wphb' ),
					'<a href="' . esc_html( Utils::get_link( 'hosting', 'hummingbird_test_response_time_hosting_upgrade_plan_link' ) ) . '" target="_blank">',
					'</a>'
				);
				?>
			</li>
		<?php endif; ?>
		<li>
			<?php
			printf(
				/* translators: %1$s - link to Query Monitor wp.org page, %2$s - closing a tag */
				esc_html__( 'Usually, your installed WordPress plugins have a huge impact on your page generation time. Some are horribly inefficient, and some are just resource intensive. Test the performance impact of your plugins using a plugin like %1$sQuery Monitor%2$s, then remove the worst offenders, or replace them with a suitable alternative.', 'wphb' ),
				'<a href="https://wordpress.org/plugins/query-monitor/" target="_blank">',
				'</a>'
			);
			?>
		</li>
	</ol>
<?php endif; ?>
