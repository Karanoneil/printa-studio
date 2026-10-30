<?php
declare(strict_types=1);

namespace Printa\Designer\Plugin;

use Magento\Quote\Model\Quote\Item\ToOrderItem;
use Magento\Quote\Model\Quote\Item as QuoteItem;
use Magento\Sales\Model\Order\Item as OrderItem;

/**
 * Copies the saved Printa design options from the quote item onto the
 * order item during quote → order conversion, so the design JSON and
 * preview survive into the admin order view and emails.
 */
class CarryDesignToOrder
{
    /**
     * @param ToOrderItem $subject
     * @param OrderItem $result
     * @param QuoteItem $quoteItem
     * @return OrderItem
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
    public function afterConvert(ToOrderItem $subject, OrderItem $result, QuoteItem $quoteItem): OrderItem
    {
        $design  = $quoteItem->getOptionByCode('printa_design');
        $preview = $quoteItem->getOptionByCode('printa_preview');

        if ($design) {
            $result->setData('printa_design', $design->getValue());
        }
        if ($preview) {
            $result->setData('printa_preview', $preview->getValue());
        }

        return $result;
    }
}
