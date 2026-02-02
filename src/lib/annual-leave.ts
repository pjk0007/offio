/**
 * 연차 계산 유틸리티
 * 근로기준법에 따른 연차 계산 로직
 */

interface AnnualLeaveParams {
  hireDate: Date | string | null;
  baseAnnualDays?: number; // 회사 정책에 따른 기본 연차
  manualBalance?: number | null; // 수동으로 설정된 연차 (null이면 자동 계산)
}

interface AnnualLeaveResult {
  totalDays: number; // 총 연차 일수
  calculationType: "auto" | "manual"; // 계산 방식
  yearsOfService: number; // 근속 연수
  description: string; // 설명
}

/**
 * 근속 연수 계산
 */
export function calculateYearsOfService(hireDate: Date | string): number {
  const hire = new Date(hireDate);
  const now = new Date();

  let years = now.getFullYear() - hire.getFullYear();
  const monthDiff = now.getMonth() - hire.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < hire.getDate())) {
    years--;
  }

  return Math.max(0, years);
}

/**
 * 근속 개월 수 계산
 */
export function calculateMonthsOfService(hireDate: Date | string): number {
  const hire = new Date(hireDate);
  const now = new Date();

  const months = (now.getFullYear() - hire.getFullYear()) * 12
    + (now.getMonth() - hire.getMonth());

  if (now.getDate() < hire.getDate()) {
    return Math.max(0, months - 1);
  }

  return Math.max(0, months);
}

/**
 * 연차 자동 계산
 * 근로기준법 기준:
 * - 1년 미만: 1개월 개근 시 1일 (최대 11일)
 * - 1년 이상: 15일 + 추가 연차
 * - 3년 이상: 2년마다 1일 추가 (최대 25일)
 */
export function calculateAnnualLeave({
  hireDate,
  baseAnnualDays = 15,
  manualBalance,
}: AnnualLeaveParams): AnnualLeaveResult {
  // 수동 설정된 연차가 있으면 그대로 사용
  if (manualBalance !== null && manualBalance !== undefined) {
    return {
      totalDays: manualBalance,
      calculationType: "manual",
      yearsOfService: hireDate ? calculateYearsOfService(hireDate) : 0,
      description: "수동 설정된 연차",
    };
  }

  // 입사일이 없으면 기본값 반환
  if (!hireDate) {
    return {
      totalDays: baseAnnualDays,
      calculationType: "auto",
      yearsOfService: 0,
      description: "기본 연차 (입사일 미등록)",
    };
  }

  const yearsOfService = calculateYearsOfService(hireDate);
  const monthsOfService = calculateMonthsOfService(hireDate);

  // 1년 미만
  if (yearsOfService < 1) {
    const days = Math.min(monthsOfService, 11); // 최대 11일
    return {
      totalDays: days,
      calculationType: "auto",
      yearsOfService: 0,
      description: `입사 ${monthsOfService}개월 (월 1일, 최대 11일)`,
    };
  }

  // 1년 이상
  let totalDays = baseAnnualDays;

  // 3년 이상: 2년마다 1일 추가
  if (yearsOfService >= 3) {
    const additionalDays = Math.floor((yearsOfService - 1) / 2);
    totalDays += additionalDays;
  }

  // 최대 25일 제한
  totalDays = Math.min(totalDays, 25);

  return {
    totalDays,
    calculationType: "auto",
    yearsOfService,
    description: `근속 ${yearsOfService}년 (기본 ${baseAnnualDays}일 + 추가 ${totalDays - baseAnnualDays}일)`,
  };
}

/**
 * 사용한 연차 계산
 */
export function calculateUsedAnnualLeave(
  vacations: Array<{
    type: string;
    status: string;
    days: number;
  }>
): number {
  return vacations
    .filter((v) =>
      (v.type === "annual" || v.type === "half") &&
      v.status === "approved"
    )
    .reduce((sum, v) => sum + v.days, 0);
}

/**
 * 잔여 연차 계산
 */
export function calculateRemainingAnnualLeave(params: {
  hireDate: Date | string | null;
  baseAnnualDays?: number;
  manualBalance?: number | null;
  usedDays: number;
}): {
  total: number;
  used: number;
  remaining: number;
  description: string;
} {
  const { totalDays, description } = calculateAnnualLeave({
    hireDate: params.hireDate,
    baseAnnualDays: params.baseAnnualDays,
    manualBalance: params.manualBalance,
  });

  return {
    total: totalDays,
    used: params.usedDays,
    remaining: Math.max(0, totalDays - params.usedDays),
    description,
  };
}
