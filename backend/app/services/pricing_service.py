from app.models.package_details import PackageDetails
from app.models.service_option import ServiceOption


class PricingService:
    @staticmethod
    def calculate_total(service_option: ServiceOption, package_details: PackageDetails) -> float:
        base_price = float(service_option.base_price)
        weight = float(package_details.weight or 1.0)

        # 1. Base price covers the first 1 kg.
        #    Only charge 10,000 VND/kg for weight beyond 1 kg:
        extra_weight = max(0.0, weight - 1.0)
        weight_component = extra_weight * 10000.0

        # 2. Pure base shipping fee without insurance/surcharges:
        total_price = base_price + weight_component
        
        return round(total_price, 2)