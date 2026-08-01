from app.models.package_details import PackageDetails
from app.models.service_option import ServiceOption


class PricingService:
    @staticmethod
    def calculate_total_for_weight(service_option: ServiceOption, weight: float) -> float:
        base_price = float(service_option.base_price)
        normalized_weight = float(weight or 1.0)

        # Base price covers the first 1 kg.
        extra_weight = max(0.0, normalized_weight - 1.0)
        weight_component = extra_weight * 10000.0

        total_price = base_price + weight_component
        return round(total_price, 2)

    @staticmethod
    def calculate_total(service_option: ServiceOption, package_details: PackageDetails) -> float:
        return PricingService.calculate_total_for_weight(service_option, float(package_details.weight or 1.0))
