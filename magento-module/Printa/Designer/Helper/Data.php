<?php
declare(strict_types=1);

namespace Printa\Designer\Helper;

use Magento\Framework\App\Helper\AbstractHelper;
use Magento\Framework\App\Helper\Context;
use Magento\Store\Model\ScopeInterface;

/**
 * Printa Designer configuration helper.
 */
class Data extends AbstractHelper
{
    public const XML_PATH_ENABLED = 'printa_designer/general/enabled';
    public const XML_PATH_ORIGIN  = 'printa_designer/general/studio_origin';

    public function isEnabled(?int $storeId = null): bool
    {
        return $this->scopeConfig->isSetFlag(
            self::XML_PATH_ENABLED,
            ScopeInterface::SCOPE_STORE,
            $storeId
        );
    }

    /**
     * Studio origin without trailing slash, e.g. "https://studio.example.com".
     */
    public function getStudioOrigin(?int $storeId = null): ?string
    {
        $origin = $this->scopeConfig->getValue(
            self::XML_PATH_ORIGIN,
            ScopeInterface::SCOPE_STORE,
            $storeId
        );
        return $origin ? rtrim(trim((string) $origin), '/') : null;
    }
}
