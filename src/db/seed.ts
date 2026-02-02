import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { hash } from "bcrypt";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function seed() {
  console.log("🌱 시드 데이터 생성 시작...\n");

  try {
    // 기존 데이터 삭제
    console.log("🗑️ 기존 데이터 삭제 중...");
    await db.delete(schema.vacations);
    await db.delete(schema.departments);
    await db.delete(schema.workPolicies);
    await db.delete(schema.windowUsages);
    await db.delete(schema.screenshots);
    await db.delete(schema.activityLogs);
    await db.delete(schema.workSessions);
    await db.delete(schema.users);
    await db.delete(schema.companies);
    console.log("   ✅ 기존 데이터 삭제 완료\n");

    // 1. 회사 3개 생성 (요금제별)
    console.log("1️⃣ 회사 생성 중...");

    const companiesData = [
      { name: "스타트업 주식회사", plan: "lite" as const, screenshotInterval: 60 },
      { name: "테크스타트업 주식회사", plan: "standard" as const, screenshotInterval: 60 },
      { name: "엔터프라이즈 코퍼레이션", plan: "enterprise" as const, screenshotInterval: 30 },
    ];

    const companies = await db
      .insert(schema.companies)
      .values(companiesData)
      .returning();

    for (const company of companies) {
      console.log(`   ✅ 회사 생성: ${company.name} (${company.plan})`);
    }

    const companyMap = Object.fromEntries(companies.map((c) => [c.plan, c]));

    // 2. 사용자 생성
    console.log("\n2️⃣ 사용자 생성 중...");
    const passwordHash = await hash("password123", 10);

    // Lite 회사 사용자 (최대 10명 제한)
    const liteUsersData = [
      { email: "lite-admin@offio.kr", name: "박라이트", role: "admin" as const, department: "경영팀" },
      { email: "lite-worker1@offio.kr", name: "이소규", role: "worker" as const, department: "개발팀" },
      { email: "lite-worker2@offio.kr", name: "김민수", role: "worker" as const, department: "개발팀" },
    ];

    // Standard 회사 사용자
    const standardUsersData = [
      { email: "admin@offio.kr", name: "김관리", role: "admin" as const, department: "경영지원팀" },
      { email: "hong@offio.kr", name: "홍길동", role: "worker" as const, department: "개발팀" },
      { email: "kim@offio.kr", name: "김철수", role: "worker" as const, department: "디자인팀" },
      { email: "lee@offio.kr", name: "이영희", role: "worker" as const, department: "개발팀" },
      { email: "park@offio.kr", name: "박지민", role: "worker" as const, department: "마케팅팀" },
      { email: "choi@offio.kr", name: "최수진", role: "manager" as const, department: "개발팀" },
      { email: "jung@offio.kr", name: "정민호", role: "worker" as const, department: "개발팀" },
      { email: "kang@offio.kr", name: "강서연", role: "worker" as const, department: "디자인팀" },
    ];

    // Enterprise 회사 사용자
    const enterpriseUsersData = [
      { email: "ent-admin@offio.kr", name: "최고관리", role: "admin" as const, department: "경영전략팀" },
      { email: "ent-manager1@offio.kr", name: "팀장일", role: "manager" as const, department: "개발1팀" },
      { email: "ent-manager2@offio.kr", name: "팀장이", role: "manager" as const, department: "개발2팀" },
      { email: "ent-worker1@offio.kr", name: "개발자일", role: "worker" as const, department: "개발1팀" },
      { email: "ent-worker2@offio.kr", name: "개발자이", role: "worker" as const, department: "개발1팀" },
      { email: "ent-worker3@offio.kr", name: "개발자삼", role: "worker" as const, department: "개발2팀" },
      { email: "ent-worker4@offio.kr", name: "디자이너일", role: "worker" as const, department: "디자인팀" },
      { email: "ent-worker5@offio.kr", name: "마케터일", role: "worker" as const, department: "마케팅팀" },
      { email: "ent-worker6@offio.kr", name: "기획자일", role: "worker" as const, department: "기획팀" },
      { email: "ent-worker7@offio.kr", name: "인사담당", role: "worker" as const, department: "인사팀" },
    ];

    const allUsersData = [
      ...liteUsersData.map((u) => ({ ...u, companyId: companyMap.lite.id })),
      ...standardUsersData.map((u) => ({ ...u, companyId: companyMap.standard.id })),
      ...enterpriseUsersData.map((u) => ({ ...u, companyId: companyMap.enterprise.id })),
    ];

    // 입사일 생성 함수 (1~5년 전)
    const generateHireDate = () => {
      const yearsAgo = Math.floor(Math.random() * 5) + 1;
      const monthsAgo = Math.floor(Math.random() * 12);
      const date = new Date();
      date.setFullYear(date.getFullYear() - yearsAgo);
      date.setMonth(date.getMonth() - monthsAgo);
      return date.toISOString().split("T")[0];
    };

    const users = await db
      .insert(schema.users)
      .values(
        allUsersData.map((u) => ({
          companyId: u.companyId,
          email: u.email,
          passwordHash,
          name: u.name,
          role: u.role,
          department: u.department,
          hireDate: generateHireDate(),
          isActive: true,
        }))
      )
      .returning();

    for (const user of users) {
      const company = companies.find((c) => c.id === user.companyId);
      console.log(`   ✅ 사용자 생성: ${user.name} (${user.email}) - ${user.role} [${company?.plan}]`);
    }

    // 사용자 ID 매핑
    const userMap = Object.fromEntries(users.map((u) => [u.email, u]));

    // 3. 근무 세션 생성 (최근 5일치)
    console.log("\n3️⃣ 근무 세션 생성 중...");
    const today = new Date();
    const sessions: schema.WorkSession[] = [];

    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const sessionDate = new Date(today);
      sessionDate.setDate(today.getDate() - dayOffset);
      const dateStr = sessionDate.toISOString().split("T")[0];

      // 오늘이면 일부만 근무 중
      const isToday = dayOffset === 0;

      for (const user of users) {
        // 관리자는 근무 기록 생략
        if (user.role === "admin") continue;

        // 오늘: 일부는 근무 중, 일부는 미출근
        if (isToday) {
          // 마지막 2명은 미출근
          const company = companies.find((c) => c.id === user.companyId);
          if (company?.plan === "standard" && (user.email === "jung@offio.kr" || user.email === "kang@offio.kr")) {
            continue;
          }
          if (company?.plan === "enterprise" && (user.email === "ent-worker6@offio.kr" || user.email === "ent-worker7@offio.kr")) {
            continue;
          }
        }

        const startHour = 8 + Math.floor(Math.random() * 2); // 8~9시
        const startMinute = Math.floor(Math.random() * 60);
        const startTime = new Date(sessionDate);
        startTime.setHours(startHour, startMinute, 0, 0);

        let endTime: Date | null = null;
        let status: "recording" | "editing" | "submitted" | "approved" | "rejected" = "recording";
        let totalWorkSeconds = 0;
        let totalActiveSeconds = 0;

        if (isToday) {
          // 오늘: 근무 중
          const now = new Date();
          totalWorkSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          totalActiveSeconds = Math.floor(totalWorkSeconds * (0.7 + Math.random() * 0.2));
          status = "recording";
        } else if (dayOffset === 1) {
          // 어제: 일부 submitted, 일부 approved
          const endHour = 17 + Math.floor(Math.random() * 2);
          endTime = new Date(sessionDate);
          endTime.setHours(endHour, Math.floor(Math.random() * 60), 0, 0);
          totalWorkSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
          totalActiveSeconds = Math.floor(totalWorkSeconds * (0.7 + Math.random() * 0.2));

          // 일부는 승인 대기
          if (["hong@offio.kr", "kim@offio.kr", "park@offio.kr", "lite-worker1@offio.kr", "ent-worker1@offio.kr", "ent-worker2@offio.kr"].includes(user.email)) {
            status = "submitted";
          } else {
            status = "approved";
          }
        } else {
          // 그 이전: 모두 approved
          const endHour = 17 + Math.floor(Math.random() * 2);
          endTime = new Date(sessionDate);
          endTime.setHours(endHour, Math.floor(Math.random() * 60), 0, 0);
          totalWorkSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
          totalActiveSeconds = Math.floor(totalWorkSeconds * (0.7 + Math.random() * 0.2));
          status = "approved";
        }

        // 해당 회사의 관리자 찾기
        const company = companies.find((c) => c.id === user.companyId);
        let adminEmail = "admin@offio.kr";
        if (company?.plan === "lite") adminEmail = "lite-admin@offio.kr";
        if (company?.plan === "enterprise") adminEmail = "ent-admin@offio.kr";

        const [session] = await db
          .insert(schema.workSessions)
          .values({
            userId: user.id,
            date: dateStr,
            startTime,
            endTime,
            status,
            totalWorkSeconds,
            totalActiveSeconds,
            deviceOs: Math.random() > 0.3 ? "macOS" : "Windows",
            deviceHostname: `${user.name}-MacBook`,
            submittedAt: status === "submitted" || status === "approved" ? endTime : null,
            approvedAt: status === "approved" ? new Date(sessionDate.getTime() + 24 * 60 * 60 * 1000) : null,
            approvedBy: status === "approved" ? userMap[adminEmail].id : null,
          })
          .returning();

        sessions.push(session);
        console.log(`   ✅ 세션 생성: ${user.name} - ${dateStr} (${status}) [${company?.plan}]`);
      }
    }

    // 4. 활동 로그 생성 (세션당 1분 단위)
    console.log("\n4️⃣ 활동 로그 생성 중...");
    let totalActivityLogs = 0;
    let totalWindowUsages = 0;
    let totalScreenshots = 0;

    // 프로그램 목록
    const programs = [
      { name: "VS Code", category: "개발", weight: 5 },
      { name: "Chrome", category: "브라우저", weight: 3 },
      { name: "Slack", category: "커뮤니케이션", weight: 2 },
      { name: "Figma", category: "디자인", weight: 1 },
      { name: "Terminal", category: "개발", weight: 1 },
      { name: "Notion", category: "문서", weight: 1 },
    ];
    const totalWeight = programs.reduce((sum, p) => sum + p.weight, 0);

    for (const session of sessions) {
      const startTime = new Date(session.startTime);
      const endTime = session.endTime ? new Date(session.endTime) : new Date();

      // 점심시간 (12:00 ~ 13:00) 제외
      const lunchStart = new Date(startTime);
      lunchStart.setHours(12, 0, 0, 0);
      const lunchEnd = new Date(startTime);
      lunchEnd.setHours(13, 0, 0, 0);

      let currentTime = new Date(startTime);
      const activityLogsToInsert: schema.NewActivityLog[] = [];

      while (currentTime < endTime) {
        const logEndTime = new Date(currentTime.getTime() + 60 * 1000); // 1분 단위

        // 점심시간이면 활동 없음
        const isLunchTime = currentTime >= lunchStart && currentTime < lunchEnd;
        const baseActivity = isLunchTime ? 0 : Math.random() * 0.7 + 0.3;

        activityLogsToInsert.push({
          sessionId: session.id,
          startTime: new Date(currentTime),
          endTime: logEndTime,
          durationSeconds: 60,
          keyboardCount: isLunchTime ? 0 : Math.floor(baseActivity * (30 + Math.random() * 20)),
          keyPressCount: isLunchTime ? 0 : Math.floor(baseActivity * (100 + Math.random() * 100)),
          mouseClickCount: isLunchTime ? 0 : Math.floor(baseActivity * (5 + Math.random() * 8)),
          mouseDistance: isLunchTime ? 0 : Math.floor(baseActivity * (100 + Math.random() * 200)),
          actionCount: isLunchTime ? 0 : Math.floor(baseActivity * (50 + Math.random() * 50)),
          isExcluded: isLunchTime,
          excludeReason: isLunchTime ? "점심시간" : null,
        });

        currentTime = logEndTime;
      }

      // 배치 삽입 (100개씩) 및 ID 수집
      const insertedActivityLogs: { id: number }[] = [];
      for (let i = 0; i < activityLogsToInsert.length; i += 100) {
        const batch = activityLogsToInsert.slice(i, i + 100);
        const inserted = await db.insert(schema.activityLogs).values(batch).returning({ id: schema.activityLogs.id });
        insertedActivityLogs.push(...inserted);
      }

      totalActivityLogs += activityLogsToInsert.length;

      // 5. 윈도우 사용량 생성 (활동 로그당 1~3개 프로그램)
      const windowUsagesToInsert: schema.NewWindowUsage[] = [];
      for (let i = 0; i < insertedActivityLogs.length; i++) {
        const activityLog = insertedActivityLogs[i];
        const originalLog = activityLogsToInsert[i];

        // 점심시간이면 건너뜀
        if (originalLog.isExcluded) continue;

        // 가중치 기반 프로그램 선택 (1~2개)
        const numPrograms = Math.floor(Math.random() * 2) + 1;
        const selectedPrograms: typeof programs = [];
        let remainingSeconds = 60;

        for (let j = 0; j < numPrograms && remainingSeconds > 0; j++) {
          // 가중치 기반 랜덤 선택
          let rand = Math.random() * totalWeight;
          let selected = programs[0];
          for (const prog of programs) {
            rand -= prog.weight;
            if (rand <= 0) {
              selected = prog;
              break;
            }
          }

          // 이미 선택된 프로그램은 제외
          if (selectedPrograms.includes(selected)) continue;
          selectedPrograms.push(selected);

          const focusSeconds = j === numPrograms - 1
            ? remainingSeconds
            : Math.floor(remainingSeconds * (0.5 + Math.random() * 0.3));

          windowUsagesToInsert.push({
            activityLogId: activityLog.id,
            programName: selected.name,
            focusSeconds,
          });

          remainingSeconds -= focusSeconds;
        }
      }

      // 윈도우 사용량 배치 삽입
      for (let i = 0; i < windowUsagesToInsert.length; i += 100) {
        const batch = windowUsagesToInsert.slice(i, i + 100);
        await db.insert(schema.windowUsages).values(batch);
      }
      totalWindowUsages += windowUsagesToInsert.length;

      // 6. 스크린샷 생성 (회사 설정에 따라 간격 조정)
      const user = users.find(u => u.id === session.userId);
      const company = companies.find(c => c.id === user?.companyId);
      const screenshotInterval = company?.screenshotInterval || 60; // 기본 60초

      const screenshotsToInsert: schema.NewScreenshot[] = [];
      let screenshotTime = new Date(startTime);
      let screenshotIndex = 0;

      while (screenshotTime < endTime) {
        // 점심시간이면 건너뜀
        const isLunchTime = screenshotTime >= lunchStart && screenshotTime < lunchEnd;

        if (!isLunchTime) {
          // 해당 시간의 activity log ID 찾기
          const logIndex = Math.floor((screenshotTime.getTime() - startTime.getTime()) / 60000);
          const activityLogId = insertedActivityLogs[logIndex]?.id;

          screenshotsToInsert.push({
            sessionId: session.id,
            activityLogId: activityLogId || null,
            capturedAt: new Date(screenshotTime),
            fileUrl: `/screenshots/${session.id}/${screenshotIndex}.png`,
            fileSize: Math.floor(100000 + Math.random() * 200000), // 100KB ~ 300KB
            isDeleted: Math.random() < 0.02, // 2% 삭제됨
          });
          screenshotIndex++;
        }

        screenshotTime = new Date(screenshotTime.getTime() + screenshotInterval * 1000);
      }

      // 스크린샷 배치 삽입
      for (let i = 0; i < screenshotsToInsert.length; i += 100) {
        const batch = screenshotsToInsert.slice(i, i + 100);
        await db.insert(schema.screenshots).values(batch);
      }
      totalScreenshots += screenshotsToInsert.length;
    }
    console.log(`   ✅ 총 ${totalActivityLogs}개 활동 로그 생성 완료`);
    console.log(`   ✅ 총 ${totalWindowUsages}개 윈도우 사용량 생성 완료`);
    console.log(`   ✅ 총 ${totalScreenshots}개 스크린샷 생성 완료`);

    // 5. Enterprise 전용 데이터 생성
    console.log("\n5️⃣ Enterprise 전용 데이터 생성 중...");

    // 근무 정책 생성 (Enterprise만)
    await db.insert(schema.workPolicies).values({
      companyId: companyMap.enterprise.id,
      workStartTime: "09:00",
      workEndTime: "18:00",
      flexibleWorkEnabled: true,
      coreTimeStart: "10:00",
      coreTimeEnd: "16:00",
      minDailyHours: 8,
      maxDailyHours: 12,
      annualVacationDays: 15,
      autoApproveEnabled: false,
    });
    console.log("   ✅ 근무 정책 생성 완료");

    // 부서 생성 (Standard)
    const standardDepartmentsData = [
      { name: "경영지원팀", order: 1 },
      { name: "개발팀", order: 2 },
      { name: "디자인팀", order: 3 },
      { name: "마케팅팀", order: 4 },
    ];

    for (const dept of standardDepartmentsData) {
      await db.insert(schema.departments).values({
        companyId: companyMap.standard.id,
        name: dept.name,
        order: dept.order,
      });
    }
    console.log(`   ✅ Standard: ${standardDepartmentsData.length}개 부서 생성 완료`);

    // 부서 생성 (Enterprise)
    const enterpriseDepartmentsData = [
      { name: "경영전략팀", order: 1 },
      { name: "개발1팀", order: 2 },
      { name: "개발2팀", order: 3 },
      { name: "디자인팀", order: 4 },
      { name: "마케팅팀", order: 5 },
      { name: "기획팀", order: 6 },
      { name: "인사팀", order: 7 },
    ];

    for (const dept of enterpriseDepartmentsData) {
      await db.insert(schema.departments).values({
        companyId: companyMap.enterprise.id,
        name: dept.name,
        order: dept.order,
      });
    }
    console.log(`   ✅ Enterprise: ${enterpriseDepartmentsData.length}개 부서 생성 완료`);

    // 휴가 생성 (Enterprise만 - 모든 직원별로 생성)
    const enterpriseUsers = users.filter((u) => u.companyId === companyMap.enterprise.id && u.role !== "admin");
    const vacationTypes = ["annual", "half", "sick", "special"] as const;
    const vacationReasons: Record<string, string[]> = {
      annual: ["개인 사유", "가족 행사", "여행", "휴식"],
      half: ["병원 예약", "개인 사유", "관공서 방문"],
      sick: ["병원 진료", "몸살 기운", "치과 진료"],
      special: ["결혼식", "장례식", "돌잔치"],
    };

    let vacationCount = 0;

    // 각 Enterprise 직원에 대해 휴가 데이터 생성
    for (const user of enterpriseUsers) {
      // 과거 승인된 휴가 (3~5개)
      const pastVacationCount = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < pastVacationCount; i++) {
        const randomType = vacationTypes[Math.floor(Math.random() * vacationTypes.length)];
        const reasons = vacationReasons[randomType];
        const randomReason = reasons[Math.floor(Math.random() * reasons.length)];

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 90) - 10); // 10~100일 전
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (randomType === "half" ? 0 : Math.floor(Math.random() * 3)));

        const days = randomType === "half" ? 1 : Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        await db.insert(schema.vacations).values({
          userId: user.id,
          type: randomType,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          days,
          reason: randomReason,
          status: "approved",
          approvedBy: userMap["ent-admin@offio.kr"].id,
          approvedAt: new Date(startDate.getTime() - 24 * 60 * 60 * 1000), // 하루 전 승인
        });
        vacationCount++;
      }

      // 미래 대기중 휴가 (일부 직원만)
      if (Math.random() > 0.5) {
        const randomType = vacationTypes[Math.floor(Math.random() * vacationTypes.length)];
        const reasons = vacationReasons[randomType];
        const randomReason = reasons[Math.floor(Math.random() * reasons.length)];

        const startDate = new Date();
        startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 5); // 5~35일 후
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (randomType === "half" ? 0 : Math.floor(Math.random() * 3)));

        const days = randomType === "half" ? 1 : Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        await db.insert(schema.vacations).values({
          userId: user.id,
          type: randomType,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          days,
          reason: randomReason,
          status: "pending",
        });
        vacationCount++;
      }
    }

    // 반려된 휴가 몇 개 추가
    for (let i = 0; i < 3; i++) {
      const randomUser = enterpriseUsers[Math.floor(Math.random() * enterpriseUsers.length)];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 2);

      await db.insert(schema.vacations).values({
        userId: randomUser.id,
        type: "annual",
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        days: 3,
        reason: "개인 사유",
        status: "rejected",
        rejectedReason: ["프로젝트 일정 충돌", "인원 부족으로 조정 필요", "다른 팀원과 일정 중복"][i],
      });
      vacationCount++;
    }

    console.log(`   ✅ ${vacationCount}개 휴가 신청 데이터 생성 완료`);

    console.log("\n✨ 시드 데이터 생성 완료!");
    console.log("\n📋 테스트 계정 (모든 비밀번호: password123):");
    console.log("\n   🏢 Lite 요금제 (스타트업 주식회사):");
    console.log("      관리자: lite-admin@offio.kr");
    console.log("      근무자: lite-worker1@offio.kr");
    console.log("\n   🏢 Standard 요금제 (테크스타트업 주식회사):");
    console.log("      관리자: admin@offio.kr");
    console.log("      근무자: hong@offio.kr");
    console.log("\n   🏢 Enterprise 요금제 (엔터프라이즈 코퍼레이션):");
    console.log("      관리자: ent-admin@offio.kr");
    console.log("      근무자: ent-worker1@offio.kr");

  } catch (error) {
    console.error("❌ 시드 데이터 생성 실패:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
