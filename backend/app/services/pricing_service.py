from app.models.package_details import PackageDetails
from app.models.service_option import ServiceOption


class PricingService:
    def calculate_total(self, service_option: ServiceOption, package_details: PackageDetails) -> float:
        weight_component = float(package_details.weight) * 5
        declared_value_component = float(package_details.declared_value or 0) * 0.01
        return round(float(service_option.base_price) + weight_component + declared_value_component, 2)

