from ..common.repo import BaseRepo
from .models import AnalysisResult


class AnalysisRepo(BaseRepo):
    model = AnalysisResult
