 SELECT (p.project_studio_spec_id IS NOT NULL) AS is_studio
     , pcl.description AS challengeType
     , pn.value AS challengeName
     , p.project_id AS challengeId
     , p.tc_direct_project_id AS projectId
     , ps.detailed_requirements_text AS detailedRequirements
     , ps.final_submission_guidelines_text AS finalSubmissionGuidelines
     , p.project_category_id AS projectType
     , pc3.parameter AS screeningScorecardId
     , pc4.parameter AS reviewScorecardId
     , pi70.value AS cmcTaskId
     , NVL((SELECT SUM(pr.number_of_submissions) FROM prize pr WHERE pr.project_id = p.project_id AND pr.prize_type_id = 14), 0) AS numberOfCheckpointsPrizes
     , (SELECT pr.prize_amount FROM prize pr WHERE pr.project_id = p.project_id AND pr.prize_type_id = 14 AND pr.place = 1)::DECIMAL(10,2) AS topCheckpointPrize
     , (SELECT pr.prize_amount FROM prize pr WHERE pr.project_id = p.project_id AND pr.prize_type_id = 15 AND pr.place = 1)::DECIMAL(10,2) AS prize1
     , (SELECT pr.prize_amount FROM prize pr WHERE pr.project_id = p.project_id AND pr.prize_type_id = 15 AND pr.place = 2)::DECIMAL(10,2) AS prize2
     , (SELECT pr.prize_amount FROM prize pr WHERE pr.project_id = p.project_id AND pr.prize_type_id = 15 AND pr.place = 3)::DECIMAL(10,2) AS prize3
     , (SELECT pr.prize_amount FROM prize pr WHERE pr.project_id = p.project_id AND pr.prize_type_id = 15 AND pr.place = 4)::DECIMAL(10,2) AS prize4
     , (SELECT pr.prize_amount FROM prize pr WHERE pr.project_id = p.project_id AND pr.prize_type_id = 15 AND pr.place = 5)::DECIMAL(10,2) AS prize5
     , (SELECT pr.prize_amount FROM prize pr WHERE pr.project_id = p.project_id AND pr.prize_type_id = 15 AND pr.place = 6)::DECIMAL(10,2) AS prize6
     , (SELECT pr.prize_amount FROM prize pr WHERE pr.project_id = p.project_id AND pr.prize_type_id = 15 AND pr.place = 7)::DECIMAL(10,2) AS prize7
     , (SELECT pr.prize_amount FROM prize pr WHERE pr.project_id = p.project_id AND pr.prize_type_id = 15 AND pr.place = 8)::DECIMAL(10,2) AS prize8
     , (SELECT NVL(NVL(ppd.actual_start_time, psd.actual_start_time), ppd.scheduled_start_time)
          FROM project proj
             , OUTER project_phase psd
             , OUTER project_phase ppd
         WHERE psd.project_id = proj.project_id
           AND psd.phase_type_id = 2
           AND ppd.project_id = proj.project_id
           AND proj.project_id = p.project_id
           AND ppd.phase_type_id = 1) AS postingDate
     , NVL(pp1.scheduled_end_time, pp2.scheduled_end_time) AS registrationEndDate
     , pp15.scheduled_end_time AS checkpointSubmissionEndDate
     , pp2.scheduled_end_time AS submissionEndDate
     , NVL(pp6.scheduled_end_time, pp4.scheduled_end_time) AS appealsEndDate
     , NVL(pp9.scheduled_end_time, pp4.scheduled_end_time) finalFixEndDate
     , nd_phase.scheduled_end_time AS currentPhaseEndDate
     , CASE WHEN (nd_phase.scheduled_end_time IS NOT NULL) THEN
                (SELECT phase_type_lu.description FROM phase_type_lu
                WHERE phase_type_id = nd_phase.phase_type_id)
            ELSE NULL
            END AS currentPhaseName
     , CASE WHEN pidr.value = 'On' THEN 
       NVL((SELECT value::decimal FROM project_info pi_dr WHERE pi_dr.project_info_type_id = 30 AND pi_dr.project_id = p.project_id), (SELECT round(NVL(pi16.value::decimal, 0)) FROM project_info pi16 WHERE pi16.project_info_type_id = 16 AND pi16.project_id = p.project_id)) 
       ELSE NULL END AS digitalRunPoints
  FROM project p
     , project_spec ps
     , project_phase pp1 --registration phase
     , project_phase pp2 --submission phase
     , outer project_phase pp6 --appeals phase
     , outer project_phase pp15 --checkpoint submission phase
     , outer project_phase pp9 --final fix phase
     , outer ( project_phase pp3  --screening phase
           , outer phase_criteria pc3 ) --screening phase scorecard
     , project_phase pp4 --review phase
     , outer phase_criteria pc4  --review phase scorecard
     , project_info pn
     , project_info pidr
     , outer project_phase nd_phase
     , project_info pi16
     , outer project_info pi70 --cmc taskid
     , project_category_lu pcl
 WHERE 1=1
   AND p.project_id = 31210000
   AND p.project_id = pn.project_id
   AND pn.project_info_type_id = 6
   AND pp1.project_id = p.project_id
   AND pp1.phase_type_id = 1  --registration phase
   AND pp2.project_id = p.project_id
   AND pp2.phase_type_id = 2  --submission phase
   AND pp6.project_id = p.project_id
   AND pp6.phase_type_id = 6  --appeals phase
   AND pp15.project_id = p.project_id
   AND pp15.phase_type_id = 15 --checkpoint submission phase
   AND pp9.project_id = p.project_id
   AND pp9.phase_type_id = 9  --final fix phase
   AND pi16.project_info_type_id = 16  --payments
   AND pi16.project_id = p.project_id
   AND pp3.project_id = p.project_id
   AND pp3.phase_type_id = 3  --screening phase
   AND pp3.project_phase_id = pc3.project_phase_id
   AND pc3.phase_criteria_type_id = 1 -- scorecardid type
   AND pp4.project_id = p.project_id
   AND pp4.phase_type_id = 4  --review phase
   AND pp4.project_phase_id = pc4.project_phase_id
   AND pc4.phase_criteria_type_id = 1 -- scorecardid type
   AND pidr.project_id = p.project_id
   AND pidr.project_info_type_id = 26  --digital run
   AND pi70.project_id = p.project_id
   AND pi70.project_info_type_id = 70  --cmc project id
   AND p.project_Id = nd_phase.project_id
   AND nd_phase.phase_type_id = (SELECT phase_type_id FROM project_phase WHERE project_id = p.project_id AND actual_start_time = (SELECT min(actual_start_time)
                                                                    FROM project_phase WHERE phase_status_id = 2 AND project_id = p.project_id AND phase_type_id IN (1,2,3,4,5,6,7,8,9,10,11,12)))
   AND p.project_category_id = pcl.project_category_id
   AND pcl.project_type_id IN (1, 2)
   AND ps.project_id = p.project_id
   AND ps.version = (SELECT max(version) FROM project_spec ps2 WHERE ps2.project_id = ps.project_id)
   AND NOT EXISTS (SELECT 1 FROM contest_eligibility ce JOIN group_contest_eligibility gce ON gce.contest_eligibility_id = ce.contest_eligibility_id WHERE ce.contest_id = p.project_id AND gce.group_id = 218)