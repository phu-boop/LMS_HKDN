# Intern Test Result Input Template

Su dung template nay de intern nop ket qua cho tung task nho. Uu tien ro rang, de verify nhanh.

## A. Header
- Tester: 
- Reviewer: 
- Ngay test: 
- Task ID nho: 
- Task cha (System Test): 
- Moi truong test (URL + branch + db): 
- Commit hash backend (neu co): 

## B. Preconditions Checklist
- [ ] API service da chay
- [ ] DB migration/seed dung version
- [ ] Tai khoan test da san sang
- [ ] Co token role can thiet
- [ ] Du lieu phu thuoc da tao (tenant/school/subscription/user)
Ghi chu precondition:

## C. Coverage Plan (truoc khi chay)
| STT | Test Case ID | Endpoint | Muc tieu test | Priority | Trang thai du kien |
|---|---|---|---|---|---|
| 1 |  |  |  | High/Med/Low | Ready/Blocked |
| 2 |  |  |  | High/Med/Low | Ready/Blocked |

## D. Test Execution Log (sau khi chay)
| STT | Test Case ID | Ket qua (PASS/FAIL/BLOCKED) | Request tom tat | Expected | Actual | Evidence link/file | Bug ID (neu co) |
|---|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |

## E. Chi tiet FAIL/BLOCKED (bat buoc)
### 1) Defect/Blocker #
- Test Case ID:
- Endpoint:
- Severity: High/Medium/Low
- Loai: Functional/Security/Validation/Permission/Performance/Data
- Preconditions:
- Steps to reproduce:
  1.
  2.
  3.
- Expected:
- Actual:
- Response code/body:
- Nhan dinh root cause ban dau:
- De xuat huong xu ly:

## F. Coverage Summary
- Tong TC trong task: 
- TC da chay: 
- PASS: 
- FAIL: 
- BLOCKED: 
- Ty le PASS tren TC da chay (%): 
- Ty le hoan thanh task (%): 

Cong thuc:
- PASS rate = PASS / (PASS + FAIL)
- Completion = (PASS + FAIL + BLOCKED) / Tong TC

## G. Risk & Regression Impact
- Cac khu vuc co nguy co anh huong:
- Co can retest cross-module khong:
- De xuat smoke test sau fix:

## H. Reviewer Verification (cho lead/test manager)
- [ ] Coverage dung task
- [ ] Evidence day du cho FAIL/BLOCKED
- [ ] Defect viet ro rang, tai hien duoc
- [ ] Co ket luan release gate (Go/No-Go)
Nhan xet reviewer:

## I. Release Gate Recommendation
- De xuat: Go / No-Go / Go with known issues
- Dieu kien kem theo (neu co):

---

## Mau dien nhanh (1 dong moi TC)
| TC ID | Ket qua | HTTP | Endpoint | Mo ta ngan | Evidence |
|---|---|---|---|---|---|
| TC-1.1-01 | PASS | 400 | POST /api/identity/identify | Identifier rong tra validation error | Postman run #12 |
| TC-1.1-03 | FAIL | 404 | POST /api/identity/identify | Lo thong tin user khong ton tai | bug LMS-123 |
